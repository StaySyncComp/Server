import { Response } from "express";
import { prismaClient } from "../prisma";
import { ExtendedRequest } from "../types/users/usersRequests";
import { checkScopedAccess } from "./permissionsUtils";
import { checkPermissionScopesSocket } from "../middlewares/permission.middleware";
import { Server } from "socket.io";

type GetScopedResourceParams<T = any, SelectOrInclude = any> = {
  model: keyof typeof prismaClient;
  where: Record<string, any>;
  req: ExtendedRequest;
  res: Response;
  extractDepartmentIds: (resource: T) => number[]; // extract 1 or more departmentIds
  resourceName?: string;
  extractCreatedById?: (resource: T) => number;
} & (
  | { include?: Record<string, any>; select?: never }
  | { select?: Record<string, any>; include?: never }
);

export const getScopedResource = async <T>({
  model,
  where,
  include,
  select,
  req,
  res,
  extractDepartmentIds,
  resourceName = "Resource",
  extractCreatedById,
}: GetScopedResourceParams<T>): Promise<T | null> => {
  try {
    const prismaModel = prismaClient[model] as any;

    const resource: T | null = await prismaModel.findUnique({
      where,
      ...(include ? { include } : {}),
      ...(select ? { select } : {}),
    });

    if (!resource) {
      res.status(404).json({ message: `${resourceName} not found` });
      return null;
    }

    const departmentIds = extractDepartmentIds(resource);
    const resourceCreatedByIdNumber = extractCreatedById
      ? extractCreatedById(resource)
      : null;
    const resourceCreatedById =
      resourceCreatedByIdNumber !== null &&
      resourceCreatedByIdNumber !== undefined
        ? String(resourceCreatedByIdNumber)
        : null;
    const hasAccess = departmentIds.every((id) =>
      checkScopedAccess({ req, resourceDepartmentId: id, resourceCreatedById })
    );

    if (!hasAccess) {
      res.status(403).json({
        message: `Forbidden: not allowed to access this ${resourceName.toLowerCase()}`,
      });
      return null;
    }

    return resource;
  } catch (err) {
    console.error(`Error in getScopedResource for ${String(model)}:`, err);
    res.status(500).json({ message: "Server error" });
    return null;
  }
};

export const emitToAuthorizedSockets = async (
  io: Server,
  eventName: string,
  data: any,
  resource: string,
  action: "view" | "create" | "update" | "delete"
) => {
  const sockets = await io.fetchSockets();

  console.log(
    `Checking ${sockets.length} connected sockets for ${resource}:${action}`
  );
  const callOrganization = data.organizationId;

  for (const socket of sockets) {
    const { allowed, scopes } = await checkPermissionScopesSocket(
      socket,
      resource,
      action,
      callOrganization
    );

    if (!allowed) {
      console.log(
        `Skipping socket ${socket.id}: no ${resource}:${action} permission`
      );
      continue;
    }

    // Optionally: apply additional scope filtering here if needed

    socket.emit(eventName, data);
    console.log(
      `✅ Emitted ${eventName} to socket ${
        socket.id
      } with scopes: [${scopes.join(", ")}]`
    );
  }
};
