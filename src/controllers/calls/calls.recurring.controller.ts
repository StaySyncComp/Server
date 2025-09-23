import { Request, Response } from "express";
import { prismaClient } from "../../prisma";
import {
  getDynamicData,
  getMissingParams,
  getUpdatedFields,
} from "../../utils/dynamicData";
import { ExtendedRequest } from "../../types/users/usersRequests";

export const createRecurringCall = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  try {
    const {
      title,
      description,
      locationId,
      departmentId,
      createdById,
      callCategoryId,
      organizationId,
      frequency,
      times,
      startDate,
      endDate,
      daysOfWeek,
    } = req.body;

    const userId = req.user?.id;

    const requiredFields = [
      "title",
      "description",
      "locationId",
      "departmentId",
      "organizationId",
      "frequency",
      "times",
      "startDate",
      "daysOfWeek",
    ];

    const combinedData = {
      title,
      description,
      locationId,
      departmentId,
      organizationId,
      frequency,
      times,
      startDate,
      daysOfWeek,
    };

    const missing = getMissingParams(combinedData, requiredFields);
    if (missing.length > 0) {
      return res.status(400).json({
        message: "Missing required parameters",
        missing,
      });
    }

    const recurringCall = await prismaClient.recurringCall.create({
      data: {
        title,
        description,
        location: { connect: { id: locationId } },
        department: { connect: { id: Number(departmentId) } },
        createdBy: { connect: { id: createdById || userId } },
        callCategory: { connect: { id: Number(callCategoryId) } },
        organization: { connect: { id: Number(organizationId) } },
        frequency,
        times,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        daysOfWeek: daysOfWeek.map(Number),
      },
    });

    res.status(200).json(recurringCall);
  } catch (error) {
    console.error("Error in createRecurringCall:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getRecurringCalls = async (
  req: ExtendedRequest,
  res: Response
): Promise<void> => {
  return getDynamicData(req, res, {
    model: "recurringCall",
    searchFields: [
      { path: "$.he", field: "title" },
      { path: "$.en", field: "title" },
    ],
    include: {
      createdBy: true,
    },
    defaultSortField: "startDate",
  });
};

export const deleteRecurringCall = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;

  const parsedId = parseInt(id);
  if (isNaN(parsedId)) return console.error("Invalid ID:", id);

  try {
    const recurringCall = await prismaClient.recurringCall.findUnique({
      where: { id: parseInt(id) },
    });

    if (!recurringCall)
      return res.status(404).json({ message: "Recurring call not found" });

    await prismaClient.recurringCall.delete({
      where: { id: parseInt(id) },
    });

    return res
      .status(200)
      .json({ message: "Recurring call deleted successfully" });
  } catch (error) {
    console.error("Error in deleteRecurringCall:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateRecurringCall = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  const {
    title,
    description,
    locationId,
    departmentId,
    createdById,
    callCategoryId,
    organizationId,
    frequency,
    times,
    startDate,
    endDate,
    daysOfWeek,
  } = req.body;

  try {
    // Fetch the existing recurring call
    const existingRecurringCall = await prismaClient.recurringCall.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingRecurringCall)
      return res.status(404).json({ message: "Recurring call not found" });

    const updatedFields = getUpdatedFields(existingRecurringCall, {
      title,
      description,
      locationId,
      departmentId,
      createdById,
      callCategoryId,
      organizationId,
      frequency,
      times,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      daysOfWeek: daysOfWeek ? daysOfWeek.map(Number) : undefined,
    });

    // If no fields have changed, return early
    if (Object.keys(updatedFields).length === 0)
      return res.status(200).json({ message: "No changes detected" });

    // Perform the update
    const updatedRecurringCall = await prismaClient.recurringCall.update({
      where: { id: parseInt(id) },
      data: updatedFields,
    });

    res.status(200).json(updatedRecurringCall);
  } catch (error) {
    console.error("Error in updateRecurringCall:", error);
    res.status(500).json({ message: "Server error" });
  }
};
