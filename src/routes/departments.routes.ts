import { RequestHandler, Router } from "express";
import {
  createDepartment,
  getDepartments,
  deleteDepartment,
  updateDepartment,
} from "../controllers/department.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";
import { attachPermissionScopes } from "../middlewares/permission.middleware";
import { Action } from "@prisma/client";

const withPermission = (resource: string, action: Action): RequestHandler[] => [
  verifyJWT as RequestHandler,
  attachPermissionScopes(resource, action) as RequestHandler,
];

export const departmentRouter: Router = Router();

// prefix /departments
departmentRouter.get(
  "/",
  withPermission("departments", "view"),
  getDepartments
);

departmentRouter.post(
  "/",
  withPermission("departments", "create"),
  createDepartment
);

departmentRouter.delete(
  "/",
  withPermission("departments", "delete"),
  deleteDepartment
);

departmentRouter.put(
  "/:id",
  withPermission("departments", "update"),
  updateDepartment
);
