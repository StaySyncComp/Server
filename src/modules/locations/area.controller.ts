import { Response } from "express";
import { prismaClient } from "../../shared/prisma";
import { ExtendedRequest } from "../../shared/types/users/usersRequests";
import { getDynamicData, getUpdatedFields } from "../../shared/utils/dynamicData";
import asyncHandler from "express-async-handler";
export const getAllAreas = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    return getDynamicData(req, res, {
      model: "area",
      searchFields: [
        { path: "$.he", field: "name" },
        { path: "$.en", field: "name" },
        { path: "$.ar", field: "name" },
      ],
      includeCounts: { Location: true },
      transformResponse: (data: any) => {
        // Robust natural sort function that handles numbers within strings dynamically
        const naturalCompare = (strA: string, strB: string): number => {
          // Normalize strings - handle empty cases
          if (!strA && !strB) return 0;
          if (!strA) return -1;
          if (!strB) return 1;
          
          // Tokenize strings into alternating text and number segments
          const tokenize = (str: string): Array<{ type: 'text' | 'number'; value: string | number }> => {
            const tokens: Array<{ type: 'text' | 'number'; value: string | number }> = [];
            const matches = str.match(/(\d+|\D+)/g) || [];
            
            for (const match of matches) {
              if (/^\d+$/.test(match)) {
                // Convert to number for proper numeric comparison (handles leading zeros)
                tokens.push({ type: 'number', value: parseInt(match, 10) });
              } else {
                // Keep as string for text comparison
                tokens.push({ type: 'text', value: match });
              }
            }
            
            return tokens;
          };
          
          const tokensA = tokenize(strA);
          const tokensB = tokenize(strB);
          const maxLength = Math.max(tokensA.length, tokensB.length);
          
          for (let i = 0; i < maxLength; i++) {
            const tokenA = tokensA[i];
            const tokenB = tokensB[i];
            
            // If one string is shorter, it comes first
            if (!tokenA) return -1;
            if (!tokenB) return 1;
            
            // If types match, compare accordingly
            if (tokenA.type === 'number' && tokenB.type === 'number') {
              // Numeric comparison
              if (tokenA.value !== tokenB.value) {
                return (tokenA.value as number) - (tokenB.value as number);
              }
            } else if (tokenA.type === 'text' && tokenB.type === 'text') {
              // Text comparison using Hebrew locale
              const compare = (tokenA.value as string).localeCompare(
                tokenB.value as string,
                "he",
                { sensitivity: "base", numeric: false }
              );
              if (compare !== 0) {
                return compare;
              }
            } else {
              // Mixed types: numbers come before text
              if (tokenA.type === 'number') return -1;
              if (tokenB.type === 'number') return 1;
            }
          }
          
          return 0;
        };
        
        // Sort by Hebrew name with natural sorting (transformResponse receives the array directly)
        if (Array.isArray(data)) {
          return [...data].sort((a, b) => {
            const nameA = (a.name?.he || a.name?.en || a.name?.ar || "").toLowerCase().trim();
            const nameB = (b.name?.he || b.name?.en || b.name?.ar || "").toLowerCase().trim();
            return naturalCompare(nameA, nameB);
          });
        }
        return data;
      },
    });
  }
);

export const createArea = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
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
  }
);

export const updateArea = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
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
  }
);

export const deleteArea = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ message: "Area ID is required" });

      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return res.status(400).json({ message: "Invalid area ID" });
      }

      // Check if area exists and get related locations
      const area = await prismaClient.area.findUnique({
        where: { id: parsedId },
        include: {
          Location: true,
        },
      });

      if (!area) {
        return res.status(404).json({ message: "Area not found" });
      }

      // Prevent deletion if locations exist (similar to role deletion pattern)
      if (area.Location && area.Location.length > 0) {
        return res.status(400).json({
          message:
            "Cannot delete area that has associated locations. Please delete or reassign all locations first.",
        });
      }

      // Delete the area
      await prismaClient.area.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: "Area deleted successfully" });
    } catch (error: any) {
      console.error("Error in deleteArea:", error);

      // Handle foreign key constraint errors
      if (error.code === "P2003") {
        return res.status(400).json({
          message: "Cannot delete area due to existing relationships",
        });
      }

      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getAreaById = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    try {
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
  }
);
