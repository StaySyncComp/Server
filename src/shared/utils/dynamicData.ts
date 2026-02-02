import { prismaClient } from "../prisma";
import { ExtendedRequest } from "../types/users/usersRequests";
import { Response } from "express";
type GetDynamicDataOptions = {
  model: string;
  searchFields?: { path: string; field: string }[];
  includeCounts?: { [key: string]: boolean };
  include?: { [key: string]: boolean | object };
  excludeOrganizationId?: boolean;
  defaultSortField?: string;
  whereClause?: { [key: string]: any };
  transformResponse?: (data: any) => any;
  filters?: string[];
  departmentWhereClause?: (departmentIds: number[]) => object;
  select?: { [key: string]: boolean };
};

export const getDynamicData = async (
  req: ExtendedRequest,
  res: Response,
  options: GetDynamicDataOptions
): Promise<any> => {
  try {
    const {
      organizationId,
      page,
      pageSize,
      search,
      sortField,
      sortDirection,
      ...restQuery
    } = req.query;

    const finalFilters = { ...restQuery, ...req.body, ...req.params };
    const organizationIdNumber = Number(organizationId);
    const selectClause = options.select;
    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSizeNumber = pageSize
      ? parseInt(pageSize as string, 10)
      : undefined;
    const skip =
      pageNumber && pageSizeNumber
        ? (pageNumber - 1) * pageSizeNumber
        : undefined;
    const take = pageSizeNumber;

    const whereClause: any = { ...options.whereClause };

    const permission = req.permissionScope;

    if (!options.excludeOrganizationId) {
      whereClause.organizationId = organizationIdNumber;
    }

    if (
      permission?.scopes.includes("own") &&
      typeof options.departmentWhereClause === "function" &&
      Array.isArray(req.user?.organizationRoles)
    ) {
      const userDepartmentIds = req.user.organizationRoles
        .filter(
          (role) =>
            role.organizationId === organizationIdNumber &&
            role.departmentId !== null
        )
        .map((role) => role.departmentId as number);

      if (!userDepartmentIds.length) {
        return res
          .status(403)
          .json({ message: "Forbidden: No departments assigned" });
      }

      Object.assign(
        whereClause,
        options.departmentWhereClause(userDepartmentIds)
      );
    }

    if (options.filters?.length) {
      for (const filterName of options.filters) {
        const rawValue = finalFilters[filterName];
        if (rawValue !== undefined) {
          const valueStr = rawValue as string;

          // NOT filters
          if (valueStr.startsWith("!")) {
            const actual = valueStr.slice(1);
            if (actual.includes(",")) {
              const values = actual.split(",").map((v) => (isNaN(+v) ? v : +v));
              whereClause[filterName] = { notIn: values };
            } else {
              const value = /^\d+$/.test(actual)
                ? parseInt(actual, 10)
                : actual;
              whereClause[filterName] = { not: value };
            }
          }
          // IN filters
          else if (valueStr.includes(",")) {
            const values = valueStr.split(",").map((v) => (isNaN(+v) ? v : +v));
            whereClause[filterName] = { in: values };
          }
          // EQUALS filter
          else {
            const value = /^\d+$/.test(valueStr)
              ? parseInt(valueStr, 10)
              : valueStr;
            whereClause[filterName] = value;
          }
        }
      }
    }

    function buildNestedJsonSearch(
      relationAndJsonField: string,
      jsonKey: string,
      search: string
    ) {
      const isJsonSearch = !!jsonKey;
      const isNumeric = !isNaN(Number(search));
      const searchValue =
        isNumeric && !isJsonSearch ? Number(search) : String(search);

      // Case: direct field (not nested, and no JSON search)
      if (!relationAndJsonField.includes(".") && !jsonKey) {
        return {
          [relationAndJsonField]: isNumeric
            ? { equals: searchValue }
            : { contains: searchValue, mode: "insensitive" },
        };
      }

      // Case: flat JSON field (not nested relation)
      if (!relationAndJsonField.includes(".")) {
        return {
          [relationAndJsonField]: {
            path: [jsonKey],
            string_contains: searchValue,
          },
        };
      }

      // Case: nested relation
      const [relation, jsonField] = relationAndJsonField.split(".");

      // Case: nested relation + JSON field
      if (jsonKey) {
        return {
          [relation]: {
            [jsonField]: {
              path: [jsonKey],
              string_contains: searchValue,
            },
          },
        };
      }

      // Case: nested relation + flat field (no JSON key)
      return {
        [relation]: {
          [jsonField]: isNumeric
            ? { equals: searchValue }
            : { contains: searchValue, mode: "insensitive" },
        },
      };
    }

    if (
      typeof search === "string" &&
      search.trim() !== "" &&
      options.searchFields?.length
    ) {
      whereClause.OR = options.searchFields.map(({ path, field }) => {
        if (path) {
          const data = buildNestedJsonSearch(path, field, search);

          return data;
        } else {
          return {
            [field]: {
              contains: search,
            },
          };
        }
      });
    }

    const orderByClause = sortField
      ? { [sortField as string]: sortDirection || "asc" }
      : options.defaultSortField
      ? { [options.defaultSortField]: "desc" }
      : undefined;

    let includeClause: any = {};
    if (options.includeCounts) {
      includeClause._count = { select: options.includeCounts };
    }
    if (options.include) {
      includeClause = { ...includeClause, ...options.include };
    }
    const hasIncludes = Object.keys(includeClause).length > 0;

    const prismaModel = prismaClient[
      options.model as keyof typeof prismaClient
    ] as any;
    const isPaginated = page !== undefined && pageSize !== undefined;

    if (isPaginated) {
      const [totalCount, data] = await Promise.all([
        prismaModel.count({ where: whereClause }),
        prismaModel.findMany({
          where: whereClause,
          ...(selectClause
            ? { select: selectClause }
            : hasIncludes
            ? { include: includeClause }
            : {}),
          skip,
          take,
          orderBy: orderByClause,
        }),
      ]);

      const transformedData = options.transformResponse
        ? options.transformResponse(data)
        : data;

      res.status(200).json({ data: transformedData, totalCount });
    } else {
      const data = await prismaModel.findMany({
        where: whereClause,
        ...(selectClause
          ? { select: selectClause }
          : hasIncludes
          ? { include: includeClause }
          : {}),
        orderBy: orderByClause,
      });

      const transformedData = options.transformResponse
        ? options.transformResponse(data)
        : data;

      res.status(200).json(transformedData);
    }
  } catch (error) {
    console.error(`Error in getDynamicData for ${options.model}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUpdatedFields = (existingData: any, newData: any): any => {
  const updatedFields: any = {};

  for (const key in newData) {
    if (newData[key] !== undefined && newData[key] !== existingData[key]) {
      updatedFields[key] = newData[key];
    }
  }

  return updatedFields;
};

export function getMissingParams(
  data: Record<string, any>,
  requiredKeys: string[]
): string[] {
  return requiredKeys.filter((key) => {
    const value = data[key];
    return value === undefined || value === null || value === "";
  });
}
