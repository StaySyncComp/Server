import { Response } from "express";
import { ExtendedRequestGuest } from "../types/users/usersRequests";
import { prismaClient } from "../prisma";
import { emitToAuthorizedSockets } from "../utils/controllerUtils";
import { notifyMultipleUsers } from "../utils/expo";

export const getGuestInformation = async (
  req: ExtendedRequestGuest,
  res: Response
): Promise<any> => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const { locationId } = req.user;
  const data = await prismaClient.location.findUnique({
    where: { id: Number(locationId) },
    include: { organization: { select: { id: true, name: true } } },
  });
  console.log(data);

  return res.status(200).json(data);
};

export const getOrganizationInformation = async (
  req: ExtendedRequestGuest,
  res: Response
): Promise<any> => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const { organizationId } = req.user;
  const data = await prismaClient.organization.findUnique({
    where: { id: Number(organizationId) },
    select: {
      name: true,
      aiSettings: { select: { contextText: true } },
      logo: true,
    },
  });
  return res.status(200).json(data);
};

export const listCallGuestCategoriesForAi = async (
  req: ExtendedRequestGuest,
  res: Response
): Promise<any> => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const { organizationId } = req.user;
  if (!organizationId)
    return res.status(400).json({ message: "Missing organizationId" });
  const categories = await prismaClient.callCategory.findMany({
    where: { organizationId: Number(organizationId) },
    select: { id: true, name: true },
  });

  return res.status(200).json(categories);
};

export const createGuestCall = async (
  req: ExtendedRequestGuest,
  res: Response
): Promise<any> => {
  try {
    const { description, assignedToId, callCategoryId } = req.body;
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { locationId, organizationId } = req.user;
    const requiredFields = ["description", "callCategoryId"];
    const missing = requiredFields.filter((field) => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Missing required parameters",
        missing,
      });
    }

    const callCategory = await prismaClient.callCategory.findUnique({
      where: { id: Number(callCategoryId) },
      select: { departmentId: true },
    });

    if (!callCategory || !callCategory.departmentId) {
      return res.status(400).json({
        message:
          "Invalid callCategoryId or departmentId not found in CallCategory",
      });
    }

    const departmentId = callCategory.departmentId;

    // Build call data for creation
    const callData: any = {
      description,
      location: { connect: { id: Number(locationId) } },
      callCategory: { connect: { id: Number(callCategoryId) } },
      organizationId: Number(organizationId),
      status: req.body.status || "OPENED",
      Department: { connect: { id: Number(departmentId) } },
    };

    if (assignedToId) {
      callData.assignedTo = { connect: { id: Number(assignedToId) } };
    }

    // Create call with Prisma
    const call = await prismaClient.call.create({
      data: {
        ...callData,
        // Create initial CallStatusHistory entry
        CallStatusHistory: {
          create: {
            fromStatus: null,
            toStatus: "OPENED",
            changedAt: new Date(),
          },
        },
      },
      include: {
        callCategory: { select: { name: true, id: true, expectedTime: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        Department: { select: { name: true, id: true } },
        CallStatusHistory: {
          include: {
            changedBy: { select: { name: true, id: true, logo: true } },
            assignedTo: { select: { id: true, name: true } },
          },
        },
        closedBy: { select: { id: true, name: true } },
        location: {
          select: {
            name: true,
            id: true,
            area: true,
            roomNumber: true,
          },
        },
      },
    });

    // Notify all users in the department
    const usersInDepartment = await prismaClient.user.findMany({
      where: {
        organizationRoles: { some: { departmentId: Number(departmentId) } },
      },
      select: { id: true },
    });

    const userIds = usersInDepartment.map((u) => u.id);
    const io = req.app.get("io");
    await emitToAuthorizedSockets(io, "call:update", call, "calls", "view");
    await notifyMultipleUsers(userIds, {
      title: "New Department Call",
      body: "A new call has been added to your department.",
      data: { departmentId },
    });

    res.status(200).json(call);
  } catch (error) {
    console.error("Error in createNewCall:", error);
    res.status(500).json({ message: "Server error" });
  }
};
