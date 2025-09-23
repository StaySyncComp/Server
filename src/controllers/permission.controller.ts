import { json, Request, Response } from "express";
import { prismaClient } from "../prisma";
import { ExtendedRequest } from "../types/users/usersRequests";
import { Permission } from "@prisma/client";
import { getMissingParams, getUpdatedFields } from "../utils/dynamicData";
export const createPermission = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { roleId, resource, action, scope } = req.body;

    const requiredFields = ["roleId", "resource", "action", "scope"];
    const missing = getMissingParams(req.body, requiredFields);
    if (missing.length > 0) {
      return res.status(400).json({
        error: "Missing required parameters",
        missing,
      });
    }

    // Check if permission already exists for this role, resource, and action
    const existingPermission = await prismaClient.permission.findFirst({
      where: { roleId, resource, action },
    });

    let permission;
    if (existingPermission) {
      // Only update if scope is different
      if (existingPermission.scope !== scope) {
        permission = await prismaClient.permission.update({
          where: { id: existingPermission.id },
          data: { scope },
        });
        return res.status(200).json(permission);
      } else {
        return res.status(200).json(existingPermission);
      }
    } else {
      permission = await prismaClient.permission.create({
        data: { roleId, resource, action, scope },
      });
      return res.status(201).json(permission);
    }
  } catch (error) {
    console.error("Error managing permission:", error);
    return res.status(500).json({ error: "Failed to manage permission" });
  }
};

export const deletePermission = async (req: Request, res: Response) => {
  try {
    const permissionId = Number(req.params.id);

    if (isNaN(permissionId))
      return res.status(400).json({ error: "Invalid permission ID" });

    // Check if permission exists
    const permission = await prismaClient.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return res.status(404).json({ error: "Permission not found" });
    }

    // Delete the permission
    await prismaClient.permission.delete({
      where: { id: permissionId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting permission:", error);
    return res.status(500).json({ error: "Failed to delete permission" });
  }
};

export const getPermissions = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const { roleId } = req.query;
  if (!roleId) return res.status(400).json({ error: "Invalid role ID" });
  try {
    const permissions = await prismaClient.permission.findMany({
      where: { roleId: Number(roleId) },
      orderBy: { resource: "asc" },
    });
    return res.status(200).json(permissions);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to fetch permissions" });
  }
};

export const updatePermission = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const id = Number(req.params.id);

  const { resource, action, scope } = req.body as Permission;

  if (!id) return res.status(400).json({ error: "Invalid permission ID" });

  try {
    const existingPermission = await prismaClient.permission.findUnique({
      where: { id },
    });

    if (!existingPermission)
      return res.status(404).json({ error: "Permission not found" });

    // Only update changed fields
    const updatedFields = getUpdatedFields(existingPermission, {
      resource,
      action,
      scope,
    });

    if (Object.keys(updatedFields).length === 0) {
      return res.status(200).json(existingPermission);
    }

    const updatedPermission = await prismaClient.permission.update({
      where: { id },
      data: updatedFields,
    });

    return res.status(200).json(updatedPermission);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to update permission" });
  }
};

export const upsertPermissions = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const permissions: Permission[] = req.body;
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return res.status(400).json({ error: "No permissions provided" });
  }

  try {
    // 1. Build a unique key for each permission to check existence
    const keys = permissions.map(
      (p) => `${p.roleId}|${p.resource}|${p.action}`
    );

    // 2. Fetch all existing permissions in one query
    const existingPermissions = await prismaClient.permission.findMany({
      where: {
        OR: permissions.map((p) => ({
          roleId: p.roleId,
          resource: p.resource,
          action: p.action,
        })),
      },
    });

    // 3. Map existing permissions for quick lookup
    const existingMap = new Map(
      existingPermissions.map((p) => [
        `${p.roleId}|${p.resource}|${p.action}`,
        p,
      ])
    );

    // 4. Prepare arrays for batch create and update
    const toCreate: Omit<Permission, "id">[] = [];
    const toUpdate: { id: number; data: Partial<Permission> }[] = [];
    const results: Permission[] = [];

    for (const perm of permissions) {
      const key = `${perm.roleId}|${perm.resource}|${perm.action}`;
      const existing = existingMap.get(key);

      if (existing) {
        const updatedFields = getUpdatedFields(existing, { scope: perm.scope });
        if (Object.keys(updatedFields).length > 0) {
          toUpdate.push({ id: existing.id, data: updatedFields });
          // We'll fetch updated records after updateMany
        } else {
          results.push(existing);
        }
      } else {
        toCreate.push({
          roleId: perm.roleId,
          resource: perm.resource,
          action: perm.action,
          scope: perm.scope,
        });
      }
    }

    // 5. Batch create
    if (toCreate.length > 0) {
      await prismaClient.permission.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      // Fetch the newly created permissions to include in results
      const created = await prismaClient.permission.findMany({
        where: {
          OR: toCreate.map((p) => ({
            roleId: p.roleId,
            resource: p.resource,
            action: p.action,
          })),
        },
      });
      results.push(...created);
    }

    // 6. Batch update (no updateMany for different data, so update sequentially but in parallel)
    if (toUpdate.length > 0) {
      const updated = await Promise.all(
        toUpdate.map((u) =>
          prismaClient.permission.update({
            where: { id: u.id },
            data: u.data,
          })
        )
      );
      results.push(...updated);
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error upserting permissions:", error);
    return res.status(500).json({ error: "Failed to upsert permissions" });
  }
};
