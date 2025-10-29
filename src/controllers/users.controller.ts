import { Request, Response } from "express";
import { prismaClient } from "../prisma";
import { CreateUserRequest } from "../types/users/usersRequests";
import { getValidUsername } from "../utils/authUtils";
import { ExtendedRequest } from "../types/users/usersRequests";
import bcrypt from "bcrypt";
import { getDynamicData, getUpdatedFields } from "../utils/dynamicData";
import { checkScopedAccess } from "../utils/permissionsUtils";
import { getScopedResource } from "../utils/controllerUtils";
import { OrganizationRole, User } from "@prisma/client";
import { deleteImage } from "../utils/supabaseUtils";
import asyncHandler from "express-async-handler";

export const getAllUsers = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<void> => {
    const { organizationId } = req.query;
    try {
      const result = await prismaClient.user.findMany({
        where: {
          organizationRoles: {
            some: { organizationId: Number(organizationId) },
          },
        },
        include: { organizationRoles: { include: { role: true } } },
      });
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getUsersWithRoles = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<void> => {
    return getDynamicData(req, res, {
      model: "user",
      defaultSortField: "id",
      excludeOrganizationId: true,
      whereClause: {
        organizationRoles: {
          some: {
            organizationId: Number(req.query.organizationId),
          },
        },
      },
      include: {
        organizationRoles: {
          include: {
            role: true,
          },
        },
      },
      searchFields: [
        { path: "", field: "username" },
        { path: "", field: "email" },
        { path: "", field: "name" },
      ],
      filters: ["userType"],
      departmentWhereClause: (departmentIds) => ({
        organizationRoles: {
          some: {
            departmentId: { in: departmentIds },
          },
        },
      }),
      transformResponse: (data) =>
        data.map((user: any) => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }),
    });
  }
);

export const createUser = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const {
      username,
      name,
      email,
      userType,
      password,
      organizationId,
      role,
      logo,
      departmentId,
    }: CreateUserRequest & { departmentId?: number } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    try {
      const existingUser = await prismaClient.user.findFirst({
        where: { email },
      });
      if (existingUser)
        return res
          .status(400)
          .json({ message: "User with this email already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const validUsername = await getValidUsername(username, email);

      const newUser = await prismaClient.user.create({
        data: {
          username: validUsername,
          name,
          email,
          userType,
          password: hashedPassword,
          logo: logo ? logo : "",
        },
      });
      let organizationRoles = {};
      if (organizationId && role) {
        organizationRoles = await prismaClient.organizationRole.create({
          data: {
            organizationId: organizationId,
            userId: newUser.id,
            roleId: Number(role),
            ...(departmentId !== undefined && { departmentId }),
          },
        });
      }

      return res
        .status(201)
        .json({ ...newUser, organizationRoles: [organizationRoles] });
    } catch (error) {
      console.error("Error in createUser:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const createAdminUser = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    const {
      username,
      name,
      email,
      password,
      organizationId,
      role,
      logo,
      departmentId,
    }: CreateUserRequest & { departmentId?: number } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    if (departmentId) {
      const department = await prismaClient.department.findUnique({
        where: { id: departmentId },
        select: { organizationId: true },
      });

      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      const hasDeptAccess = checkScopedAccess({
        req,
        resourceDepartmentId: departmentId,
      });

      if (!hasDeptAccess) {
        return res
          .status(403)
          .json({ message: "Forbidden: no access to this department" });
      }
    }

    try {
      const existingUser = await prismaClient.user.findFirst({
        where: { email },
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const validUsername = await getValidUsername(username, email);

      const newUser = await prismaClient.user.create({
        data: {
          username: validUsername,
          name,
          email,
          userType: "EMPLOYEE",
          password: hashedPassword,
          logo: logo || "",
        },
      });

      let organizationRoles = {};
      if (organizationId && role) {
        organizationRoles = await prismaClient.organizationRole.create({
          data: {
            organizationId: Number(organizationId),
            userId: newUser.id,
            roleId: Number(role),
            ...(departmentId !== undefined && { departmentId }),
          },
        });
      }

      return res
        .status(201)
        .json({ ...newUser, organizationRoles: [organizationRoles] });
    } catch (error) {
      console.error("Error in createUser:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export const adminUpdateUser = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    const { id } = req.params;
    const { name, email, password, logo, role, departmentId } = req.body;

    if (!id) return res.status(400).json({ message: "Missing user ID" });

    try {
      const existingUser = await getScopedResource<
        User & { organizationRoles: any[] }
      >({
        model: "user",
        where: { id: Number(id) },
        include: {
          organizationRoles: {
            include: { role: true, organization: true },
          },
        },
        req,
        res,
        resourceName: "User",
        extractCreatedById(user) {
          return user?.id;
        },
        extractDepartmentIds: (user) => {
          return user.organizationRoles?.[0]?.departmentId
            ? [user.organizationRoles[0].departmentId]
            : [];
        },
      });

      if (!existingUser) return;

      const roleLink = existingUser.organizationRoles?.[0];

      const data = getUpdatedFields(existingUser, { name, email, logo });

      if (password) {
        const match = await bcrypt.compare(password, existingUser.password);
        if (!match) {
          data.password = await bcrypt.hash(password, 10);
        }
      }
      if (data.logo && existingUser && existingUser.logo)
        await deleteImage(existingUser.logo);
      const currentRoleId = roleLink?.role?.id;
      const orgRoleUpdate: any = {};

      if (role && Number(role) !== currentRoleId) {
        orgRoleUpdate.roleId = Number(role);
      }

      if (departmentId !== undefined) {
        const newDept = await getScopedResource<User>({
          model: "department",
          where: { id: departmentId },
          req,
          res,
          extractDepartmentIds: (dept) => [dept.id],
          resourceName: "Department",
        });
        if (!newDept) return;

        orgRoleUpdate.departmentId = departmentId;
      }

      if (Object.keys(orgRoleUpdate).length > 0) {
        await prismaClient.organizationRole.updateMany({
          where: { userId: existingUser.id },
          data: orgRoleUpdate,
        });
      }

      if (
        Object.keys(data).length === 0 &&
        Object.keys(orgRoleUpdate).length === 0
      ) {
        return res.status(200).json(existingUser);
      }

      const updatedUser = await prismaClient.user.update({
        where: { id: Number(id) },
        data,
      });

      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error in adminUpdateUser:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getUser = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.user;

    try {
      const result = await prismaClient.user.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          userType: true,
          password: false,
          logo: true,
          organizationRoles: {
            where: {
              organization: {
                organizationRoles: {
                  some: { userId: Number(id) },
                },
              },
            },
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                  permissions: true,
                  organizationId: true,
                },
              },
              department: true,
            },
          },
        },
      });
      if (!result) res.status(404).json({ message: "User not found" });
      else res.status(200).json(result);
    } catch (error) {
      console.error("Error in getUser:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);
export const updateUser = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.user;
    const { name, email, password, oldPassword, logo, phoneNumber } = req.body;

    try {
      if (!name && !email && !password)
        return res
          .status(400)
          .json({ message: "No fields to update provided" });

      // Fetch the user's current data
      const currentUser = await prismaClient.user.findUnique({
        where: { id: Number(id) },
      });

      if (!currentUser)
        return res.status(404).json({ message: "User not found" });

      // Check if the email is already in use by another user
      if (email) {
        const existingUser = await prismaClient.user.findFirst({
          where: { email, id: { not: Number(id) } },
        });

        if (existingUser)
          return res.status(400).json({ message: "Email already in use" });
      }

      // Construct the data object dynamically
      const data: any = {};
      if (name) data.name = name;
      if (email) data.email = email;
      if (logo) {
        data.logo = logo;

        if (currentUser.logo) {
          console.log("deleting image", currentUser.logo);

          await deleteImage(currentUser.logo);
        }
      }
      if (phoneNumber) data.phoneNumber = phoneNumber;
      // Handle password update
      if (password) {
        if (!oldPassword) {
          return res
            .status(400)
            .json({ message: "Old password is required to update password" });
        }

        const isOldPasswordValid = await bcrypt.compare(
          oldPassword,
          currentUser.password
        );

        if (!isOldPasswordValid)
          return res.status(400).json({ message: "Old password is incorrect" });

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        data.password = hashedPassword;
      }

      // Perform the update
      const updatedUser = await prismaClient.user.update({
        where: { id: Number(id) },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          userType: true,
          logo: true,
          phoneNumber: true,
        },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error in updateUser:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);
export const deleteUser = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    const { id } = req.params;

    if (!id) return;
    res.status(400).json({ message: "Missing user ID" });

    try {
      const userId = Number(id);

      const userToDelete = await getScopedResource<
        User & { organizationRoles: OrganizationRole[] }
      >({
        model: "user",
        where: { id: userId },
        include: {
          organizationRoles: true,
        },
        req,
        res,
        resourceName: "User",
        extractDepartmentIds: (user) =>
          user.organizationRoles
            .map((role) => role.departmentId)
            .filter((id): id is number => id !== null && id !== undefined),
      });

      if (!userToDelete) return;

      await prismaClient.organizationRole.deleteMany({
        where: { userId },
      });

      const deleted = await prismaClient.user.delete({
        where: { id: userId },
      });

      res.status(200).json({
        message: "User deleted successfully",
        deletedUserId: deleted.id,
      });
    } catch (error) {
      console.error("Error in deleteUser:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);
