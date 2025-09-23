import { prismaClient } from "../prisma";
import { Response } from "express";
import { ExtendedRequest } from "../types/users/usersRequests";
import { Resources } from "../utils/constants";
export const createOrganization = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const userId = req.user?.id;
  const { name } = req.body;

  if (!userId)
    return res.status(400).json({ message: "Missing required fields: userId" });
  if (!name)
    return res.status(400).json({ message: "Missing required fields: name" });

  try {
    const result = await prismaClient.$transaction(async (prisma) => {
      const existingOrganization = await prisma.organization.findFirst({
        where: {
          name,
          ownerId: userId,
        },
      });
      if (existingOrganization) {
        throw new Error("שם הארגון כבר קיים תחת המשתמש הזה");
      }

      // ✅ Step 2: Create the organization
      const organization = await prisma.organization.create({
        data: {
          name,
          ownerId: userId,
          customStyles: {}, // Default empty JSON
          logo: "",
          years: [],
        },
      });

      const role = await prisma.role.create({
        data: {
          name: { he: "מנהל", en: "Owner", ar: "مدير" },
          organizationId: organization.id,
        },
      });
      console.log(role, "role");

      await prisma.organizationRole.create({
        data: {
          organizationId: organization.id,
          userId,
          roleId: role.id,
        },
      });

      const adminPermissionsData = Resources.flatMap((resource) => {
        switch (resource) {
          case "app":
          case "site":
          case "reports":
            return [
              {
                roleId: role.id,
                resource: resource as any,
                action: "view" as any,
                scope: "any" as any,
              },
            ];

          default:
            return [
              {
                roleId: role.id,
                resource: resource as any,
                action: "view" as any,
                scope: "any" as any,
              },
              {
                roleId: role.id,
                resource: resource as any,
                action: "update" as any,
                scope: "any" as any,
              },
              {
                roleId: role.id,
                resource: resource as any,
                action: "create" as any,
                scope: "any" as any,
              },
              {
                roleId: role.id,
                resource: resource as any,
                action: "delete" as any,
                scope: "any" as any,
              },
            ];
        }
      });

      await prisma.permission.createMany({ data: adminPermissionsData });

      return { organization, role };
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating organization:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while creating the organization" });
  }
};

export const updateOrganization = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(400).json({ message: "User ID is required" });
    const { organizationId, name, customStyles, logo, years } = req.body;

    if (!organizationId)
      return res.status(400).json({ message: "organizationId is required" });

    const organization = await prismaClient.organization.findUnique({
      where: { id: organizationId },
      include: { owner: true },
    });

    if (!organization)
      return res.status(404).json({ message: "Organization not found" });

    if (organization.ownerId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to update this organization",
      });
    }

    // Update the organization
    const updatedOrganization = await prismaClient.organization.update({
      where: { id: organizationId },
      data: {
        ...(name && { name }),
        ...(customStyles && { customStyles }),
        ...(logo && { logo }),
        ...(years && { years }),
      },
    });

    return res.status(200).json({
      message: "Organization updated successfully",
      organization: updatedOrganization,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while updating the organization" });
  }
};

export const getOrganizations = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const id = req.user?.id;
  if (!id) return res.status(400).json({ message: "id is required" });

  const organizations = await prismaClient.organization.findMany({
    where: { organizationRoles: { some: { userId: Number(id) } } },
  });

  return res.status(200).json(organizations);
};

export const getOrganization = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const id = req.user?.id;
  const orgId = Number(req.query.organizationId);

  if (!id) return res.status(400).json({ message: "id is required" });
  if (!orgId) return res.status(400).json({ message: "orgId is required" });

  const organization = await prismaClient.organization.findFirst({
    where: { id: orgId, AND: { organizationRoles: { some: { userId: id } } } },
  });

  if (!organization)
    return res.status(404).json({ message: "Organization not found" });

  const result = {
    ...organization,
  };
  return res.status(200).json(result);
};

export const getOrganizationRole = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const id = req.user?.id;
  const orgId = Number(req.query.organizationId);

  if (!id) return res.status(400).json({ message: "id is required" });
  if (!orgId) return res.status(400).json({ message: "orgId is required" });
  console.log({ id: orgId, AND: { userId: id } }, "orgId");

  const organizationRole = await prismaClient.organizationRole.findFirst({
    where: { organizationId: orgId, AND: { userId: id } },
    include: { role: true },
  });

  if (!organizationRole)
    return res.status(404).json({ message: "Organization not found" });

  return res.status(200).json({ organizationRole });
};
