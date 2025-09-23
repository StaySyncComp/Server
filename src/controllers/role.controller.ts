import { Request, Response } from "express";
import { prismaClient } from "../prisma";
import { ExtendedRequest } from "../types/users/usersRequests";
import { Resources } from "../utils/constants";
import { getDynamicData } from "../utils/dynamicData";

export const createRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, organizationId } = req.body;

    if (!name)
      return res.status(400).json({ error: "Valid role name is required" });

    if (!organizationId || typeof organizationId !== "number") {
      return res
        .status(400)
        .json({ error: "Valid organization ID is required" });
    }

    const organization = await prismaClient.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization)
      return res.status(404).json({ error: "Organization not found" });

    const role = await prismaClient.role.create({
      data: {
        name,
        organizationId,
      },
    });
    const userPermissionsData = Resources.flatMap((resource) => {
      switch (resource) {
        case "app":
        case "site":
          return [
            {
              roleId: role.id,
              resource: resource as any,
              action: "view",
              scope: "any" as any,
            },
          ];
        default:
          return [
            {
              roleId: role.id,
              resource: resource as any,
              action: "view" as any,
              scope: "none" as any,
            },
            {
              roleId: role.id,
              resource: resource as any,
              action: "update" as any,
              scope: "none" as any,
            },
            {
              roleId: role.id,
              resource: resource as any,
              action: "create" as any,
              scope: "none" as any,
            },
            {
              roleId: role.id,
              resource: resource as any,
              action: "delete" as any,
              scope: "none" as any,
            },
          ];
      }
    });

    await prismaClient.permission.createMany({ data: userPermissionsData });

    return res.status(201).json(role);
  } catch (error) {
    console.error("Error creating role:", error);
    return res.status(500).json({ error: "Failed to create role" });
  }
};

export const getRolesByOrganization = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const organizationId = parseInt(req.query.id);
  if (isNaN(organizationId))
    return res.status(400).json({ message: "Invalid organization ID" });
  try {
    const roles = await prismaClient.role.findMany({
      where: { organizationId },
      include: {
        permissions: true,
      },
    });
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error in getRoles:", error);
    return res.status(500).json({ error: "Failed to fetch roles" });
  }
};

export const updateRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const roleId = Number(id);
    if (isNaN(roleId))
      return res.status(400).json({ error: "Invalid role ID" });

    if (!name)
      return res.status(400).json({ error: "Valid role name is required" });

    const existingRole = await prismaClient.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) return res.status(404).json({ error: "Role not found" });

    const updatedRole = await prismaClient.role.update({
      where: { id: roleId },
      data: { name },
    });

    return res.status(200).json(updatedRole);
  } catch (error) {
    console.error("Error updating role:", error);
    return res.status(500).json({ error: "Failed to update role" });
  }
};

export const deleteRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const roleId = Number(req.query.id);

    if (isNaN(roleId))
      return res.status(400).json({ error: "Invalid role ID" });

    const role = await prismaClient.role.findUnique({
      where: { id: roleId },
      include: { organizationRoles: true },
    });

    if (!role) return res.status(404).json({ error: "Role not found" });

    if (role.organizationRoles.length > 0)
      return res.status(400).json({
        error: "Cannot delete role that is assigned to users",
      });

    await prismaClient.permission.deleteMany({
      where: { roleId },
    });

    // Delete the role
    await prismaClient.role.delete({
      where: { id: roleId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting role:", error);
    return res.status(500).json({ error: "Failed to delete role" });
  }
};

export const getRoleById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const roleId = Number(req.params.id);

  if (isNaN(roleId))
    return res.status(400).json({ message: "Invalid role ID" });
  try {
    const role = await prismaClient.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
      },
    });

    if (!role) return res.status(404).json({ message: "Role not found" });
    res.status(200).json(role);
  } catch (error) {
    console.error("Error in getRole:", error);
    return res.status(500).json({ error: "Failed to fetch role" });
  }
};

export const getRoles = async (req: ExtendedRequest, res: Response) => {
  return getDynamicData(req, res, {
    model: "role",
    defaultSortField: "id",
    whereClause: {
      ...(req.query.organizationId && {
        organizationId: Number(req.query.organizationId),
      }),
      ...(req.query.search && {
        name: {
          path: "$.he",
          string_contains: req.query.search as string,
          mode: "insensitive",
        },
      }),
    },
    includeCounts: { organizationRoles: true },

    searchFields: [{ path: "$.he", field: "name" }],
    filters: [],
    transformResponse: (roles: any[]) =>
      roles.map((role) => ({
        ...role,
        userCount: role._count?.organizationRoles ?? 0,
      })),
  });
};
