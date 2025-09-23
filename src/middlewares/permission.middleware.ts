import { Response, NextFunction } from "express";
import { ExtendedRequest } from "../types/users/usersRequests";
import { prismaClient } from "../prisma"; // adjust path as needed
import { DefaultEventsMap, RemoteSocket, Socket } from "socket.io";

export const attachPermissionScopes = (
  resource: string,
  action: "view" | "create" | "update" | "delete"
) => {
  return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const userRoles = user.organizationRoles;
      const roleIds = userRoles.map((role) => role.roleId);

      if (!roleIds.length)
        return res.status(403).json({ error: "Forbidden: No roles assigned" });

      const rolesWithPermissions = await prismaClient.role.findMany({
        where: { id: { in: roleIds } },
        select: {
          id: true,
          permissions: {
            select: {
              resource: true,
              action: true,
              scope: true,
            },
          },
        },
      });

      // Flatten all permissions from all roles
      const allPermissions = rolesWithPermissions.flatMap((r) => r.permissions);

      const scopes = allPermissions
        .filter(
          (scope) => scope.resource === resource && scope.action === action
        )
        .map((scope) => scope.scope);

      if (!scopes.length || scopes.includes("none")) {
        return res
          .status(403)
          .json({ error: "Forbidden: Insufficient permissions" });
      }

      req.permissionScope = {
        resource,
        action,
        scopes: scopes.includes("any") ? ["any"] : Array.from(new Set(scopes)),
      };

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};

// Updated attachPermissionScopesSocket to RETURN permissions
export const checkPermissionScopesSocket = async (
  socket: RemoteSocket<DefaultEventsMap, any>,
  resource: string,
  action: "view" | "create" | "update" | "delete",
  organizationId: number
): Promise<{ allowed: boolean; scopes: string[] }> => {
  const user = socket.data.user;

  if (organizationId !== Number(user?.currentOrganizationId || 9999)) {
    console.warn(`Socket ${socket.id} has no matching organization`);
    return { allowed: false, scopes: [] };
  }
  if (!user) {
    console.warn(`Socket ${socket.id} has no user data`);
    return { allowed: false, scopes: [] };
  }

  const roleIds = user.organizationRoles.map((role: any) => role.roleId);

  if (!roleIds.length) {
    console.warn(`Socket ${socket.id} user has no roles`);
    return { allowed: false, scopes: [] };
  }

  const rolesWithPermissions = await prismaClient.role.findMany({
    where: { id: { in: roleIds } },
    select: {
      permissions: {
        select: {
          resource: true,
          action: true,
          scope: true,
        },
      },
    },
  });

  const allPermissions = rolesWithPermissions.flatMap((r) => r.permissions);

  const matchingPermissions = allPermissions.filter(
    (perm) => perm.resource === resource && perm.action === action
  );

  if (!matchingPermissions.length) {
    console.warn(`Socket ${socket.id} has no matching permissions`);
    return { allowed: false, scopes: [] };
  }

  const scopes = matchingPermissions.map((perm) => perm.scope);

  const allowed = !scopes.includes("none");

  return {
    allowed,
    scopes: scopes.includes("any") ? ["any"] : Array.from(new Set(scopes)),
  };
};
