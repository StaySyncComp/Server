import { RequestHandler, Router } from "express";
import { verifyJWT } from "../middlewares/JTW.middleware";
import {
  createPermission,
  getPermissions,
  updatePermission,
  upsertPermissions,
} from "../controllers/permission.controller";
import { Action } from "@prisma/client";
import { attachPermissionScopes } from "../middlewares/permission.middleware";

export const permissionRouter: Router = Router();

const withPermission = (resource: string, action: Action): RequestHandler[] => [
  verifyJWT as RequestHandler,
  attachPermissionScopes(resource, action) as RequestHandler,
];

permissionRouter.get("/", withPermission("roles", "view"), getPermissions);
permissionRouter.post("/", withPermission("roles", "create"), createPermission);
permissionRouter.put(
  "/upsert",
  withPermission("roles", "update"),
  upsertPermissions
);
permissionRouter.put(
  "/:id",
  withPermission("roles", "update"),
  updatePermission
);
