import { CallCategory } from "@prisma/client";
import { Response } from "express";
import { prismaClient } from "../../prisma";
import { ExtendedRequest } from "../../types/users/usersRequests";
import { getScopedResource } from "../../utils/controllerUtils";
import { getDynamicData, getUpdatedFields } from "../../utils/dynamicData";
import { checkScopedAccess } from "../../utils/permissionsUtils";
import { deleteImage } from "../../utils/supabaseUtils";
import asyncHandler from "express-async-handler";
export const createNewCallCategory = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    const { name, organizationId, logo, departmentId, expectedTime } = req.body;

    // Basic validation
    if (!name || !expectedTime)
      return res
        .status(400)
        .json({ message: "name and expectedTime are required" });

    if (!departmentId)
      return res.status(400).json({ message: "departmentId is required" });

    // Scoped access check
    const hasAccess = checkScopedAccess({
      req,
      resourceDepartmentId: Number(departmentId),
    });

    if (!hasAccess) {
      return res
        .status(403)
        .json({ message: "Forbidden: Access denied to this department" });
    }

    try {
      const callCategory = await prismaClient.callCategory.create({
        data: {
          name,
          logo: logo || "",
          expectedTime: Number(expectedTime),
          department: { connect: { id: Number(departmentId) } },
          organization: { connect: { id: Number(organizationId) } },
        },
      });

      return res.status(200).json(callCategory);
    } catch (error) {
      console.error("Error in createNewCallCategory:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export const getCallCategories = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    return getDynamicData(req, res, {
      model: "callCategory",
      searchFields: [
        { path: "name", field: "he" },
        { path: "name", field: "en" },
        { path: "name", field: "ar" },
      ],
      include: { department: true },
      defaultSortField: "name",
      departmentWhereClause: (departmentIds) => ({
        departmentId: { in: departmentIds },
      }),
    });
  }
);

export const deleteCategory = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    const { id } = req.params;

    try {
      const category = await getScopedResource<CallCategory>({
        model: "callCategory",
        where: { id: Number(id) },
        req,
        res,
        extractDepartmentIds: (category) => [category.departmentId],
        resourceName: "CallCategory",
        select: { logo: true, departmentId: true },
      });

      if (!category) return;

      // Delete logo if it exists
      // if (category.logo) await deleteImage(category.logo);

      // Delete the category
      await prismaClient.callCategory.delete({
        where: { id: Number(id) },
      });

      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error in deleteCategory:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const updateCategory = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    const id = req.params.id;
    const { name, logo, departmentId, expectedTime } = req.body;

    try {
      // Fetch the category with scoped resource check
      const category = await getScopedResource<CallCategory>({
        model: "callCategory",
        where: { id: Number(id) },
        req,
        res,
        extractDepartmentIds: (category) => [category.departmentId], // extract department id
        resourceName: "CallCategory",
      });

      if (!category) return; // If no category found, return early

      // Prepare the update data
      const updateData = getUpdatedFields(category, {
        name,
        logo,
        department: departmentId
          ? { connect: { id: departmentId } }
          : undefined,
        expectedTime: expectedTime ? Number(expectedTime) : 0,
      });

      // If no changes, return early
      if (Object.keys(updateData).length === 0)
        return res.status(200).json({ message: "No changes detected" });

      // Perform the update
      const result = await prismaClient.callCategory.update({
        where: { id: Number(id) },
        data: updateData,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in updateCategory:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const upsertCallCategories = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    const categories = req.body;
    if (!Array.isArray(categories))
      return res.status(400).json({ message: "categories must be an array" });

    try {
      const results = await prismaClient.$transaction(
        categories.map((category) => {
          const { id, name, logo, expectedTime, departmentId, organizationId } =
            category;

          if (id) {
            const updatedFields: any = {
              name,
              logo: logo ?? "",
              expectedTime: expectedTime ? Number(expectedTime) : 0,
            };
            if (departmentId) {
              updatedFields.department = {
                connect: { id: Number(departmentId) },
              };
            }
            if (organizationId) {
              updatedFields.organization = {
                connect: { id: Number(organizationId) },
              };
            }
            return prismaClient.callCategory.update({
              where: { id: Number(id) },
              data: updatedFields,
            });
          } else {
            return prismaClient.callCategory.create({
              data: {
                name,
                logo: logo ?? "",
                expectedTime: expectedTime ? Number(expectedTime) : 0,
                department: { connect: { id: Number(departmentId) } },
                organization: { connect: { id: Number(organizationId) } },
              },
            });
          }
        })
      );

      res.status(200).json({ message: "Call categories upserted", results });
    } catch (error) {
      console.error("Error in upsertCallCategories:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getCallCategory = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    return getScopedResource<CallCategory>({
      model: "callCategory",
      where: { id: Number(req.params.id) },
      req,
      res,
      extractDepartmentIds: (category) => [category.departmentId],
      resourceName: "CallCategory",
    });
  }
);

export const listCallCategoriesForAi = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    return getDynamicData(req, res, {
      model: "callCategory",
      searchFields: [
        { path: "$.he", field: "name" },
        { path: "$.en", field: "name" },
      ],
      select: { id: true, name: true },
      defaultSortField: "name",
      departmentWhereClause: (departmentIds) => ({
        departmentId: { in: departmentIds },
      }),
    });
  }
);
