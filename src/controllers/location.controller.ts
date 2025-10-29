import { prismaClient } from "../prisma";
import { Response } from "express";
import { ExtendedRequest } from "../types/users/usersRequests";
import { getDynamicData } from "../utils/dynamicData";
import asyncHandler from "express-async-handler";

export const createLocation = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    const userId = req.user?.id;
    const { name, organizationId, roomNumber, areaId } = req.body;

    if (
      !userId ||
      !organizationId ||
      !name ||
      typeof name !== "object" ||
      !areaId
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      const location = await prismaClient.location.create({
        data: {
          name,
          area: { connect: { id: Number(areaId) } },
          roomNumber: roomNumber ?? null,
          organization: { connect: { id: Number(organizationId) } },
        },
      });

      return res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export const getAllLocations = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    try {
      const { organizationId } = req.query;
      const result = await prismaClient.location.findMany({
        where: { organizationId: Number(organizationId) },
      });
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getAllLocations:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getLocations = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    return getDynamicData(req, res, {
      model: "location",
      searchFields: [{ path: "roomNumber", field: "" }],
      filters: ["roomNumber"],
      defaultSortField: "name",
    });
  }
);

export const getLocationsByAreaId = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const { areaId } = req.params;

    if (!areaId)
      return res.status(400).json({ message: "Missing areaId parameter" });

    return getDynamicData(req, res, {
      model: "location",
      filters: ["areaId"],
      searchFields: [{ path: "roomNumber", field: "" }],
      defaultSortField: "roomNumber",
    });
  }
);

export const deleteLocation = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const { id: locationId } = req.params;
    try {
      await prismaClient.location.delete({
        where: { id: Number(locationId) },
      });

      res.status(200).json({ message: "Location deleted" });
    } catch (error) {
      console.error("Error in deleteLocation:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const updateLocation = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const id = Number(req.params.id);
    const { name, organizationId, roomNumber } = req.body;

    try {
      await prismaClient.location.update({
        where: { id: Number(id) },
        data: {
          name,
          roomNumber: roomNumber ?? null,
          organization: { connect: { id: organizationId } },
        },
      });

      res.status(200).json({ message: "Location updated" });
    } catch (error) {
      console.error("Error in updateLocation:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const upsertLocations = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    const locations = req.body;
    if (!Array.isArray(locations))
      return res.status(400).json({ message: "locations must be an array" });

    try {
      const results = await prismaClient.$transaction(
        locations.map((location) => {
          const { id, name, roomNumber, organizationId, areaId } = location;

          if (id) {
            const updatedFields: any = {
              name,
              roomNumber: roomNumber ?? null,
              areaId: areaId ?? null,
            };

            if (organizationId) {
              updatedFields.organization = {
                connect: { id: organizationId },
              };
            }

            return prismaClient.location.update({
              where: { id },
              data: updatedFields,
            });
          } else {
            return prismaClient.location.create({
              data: {
                name,
                roomNumber: roomNumber ?? null,
                organization: { connect: { id: organizationId } },
                area: { connect: { id: areaId } },
              },
            });
          }
        })
      );

      res.status(200).json({ message: "Locations upserted", results });
    } catch (error) {
      console.error("Error in upsertLocations:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const listLocationsForAi = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    return getDynamicData(req, res, {
      model: "location",
      searchFields: [
        { path: "$.he", field: "name" },
        { path: "$.en", field: "name" },
        { path: "$.ar", field: "name" },
      ],
      select: { id: true, roomNumber: true, areaId: true },
      defaultSortField: "name",
    });
  }
);
