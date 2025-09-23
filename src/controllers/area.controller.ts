import { Response } from "express";
import { prismaClient } from "../prisma";
import { ExtendedRequest } from "../types/users/usersRequests";
import { getDynamicData, getUpdatedFields } from "../utils/dynamicData";

export const getAllAreas = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  return getDynamicData(req, res, {
    model: "area",
    searchFields: [
      { path: "$.he", field: "name" },
      { path: "$.en", field: "name" },
      { path: "$.ar", field: "name" },
    ],
    includeCounts: { Location: true },
    defaultSortField: "name",
  });
};

export const createArea = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  try {
    const { name, organizationId, color } = req.body;
    if (!name || !organizationId || typeof name !== "object" || !color)
      return res.status(400).json({ message: "error_fields_required" });

    const result = await prismaClient.area.create({
      data: {
        name,
        organization: { connect: { id: organizationId } },
        color: color || "blue",
      },
    });
    res.status(201).json(result);
  } catch (error) {
    console.error("Error in createArea:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateArea = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { name, organizationId, color } = req.body;

    if (!id) return res.status(400).json({ message: "Area ID is required" });

    // Fetch the existing area
    const existingArea = await prismaClient.area.findUnique({
      where: { id: Number(id) },
    });

    if (!existingArea)
      return res.status(404).json({ message: "Area not found" });

    const updatedData = getUpdatedFields(existingArea, {
      name,
      organization: organizationId
        ? { connect: { id: organizationId } }
        : undefined,
      color,
    });

    if (Object.keys(updatedData).length === 0)
      return res.status(200).json({ message: "No changes detected" });

    const result = await prismaClient.area.update({
      where: { id: Number(id) },
      data: updatedData,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in updateArea:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteArea = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Area ID is required" });

    await prismaClient.area.delete({
      where: { id: Number(id) },
    });
    res.status(200).json({ message: "Area deleted successfully" });
  } catch (error) {
    console.error("Error in deleteArea:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAreaById = async (
  req: ExtendedRequest,
  res: Response
): Promise<any> => {
  try {
    console.log("getAreaById");

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Area ID is required" });

    const result = await prismaClient.area.findUnique({
      where: { id: Number(id) },
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getAreaById:", error);
    res.status(500).json({ message: "Server error" });
  }
};
