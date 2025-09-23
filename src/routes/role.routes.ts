import { RequestHandler, Router } from "express";

import { verifyJWT } from "../middlewares/JTW.middleware";
import {
  createRole,
  deleteRole,
  getRoleById,
  getRoles,
  updateRole,
  getRolesByOrganization,
} from "../controllers/role.controller";
import { attachPermissionScopes } from "../middlewares/permission.middleware";
import { Action } from "@prisma/client";
const withPermission = (resource: string, action: Action): RequestHandler[] => [
  verifyJWT as RequestHandler,
  attachPermissionScopes(resource, action) as RequestHandler,
];
export const rolesRouter: Router = Router();
rolesRouter.get("/by-org", verifyJWT as RequestHandler, getRolesByOrganization);
rolesRouter.post("/", withPermission("roles", "create"), createRole);
rolesRouter.get("/", withPermission("roles", "view"), getRoles);
rolesRouter.get("/:id", withPermission("roles", "view"), getRoleById);
rolesRouter.put("/:id", withPermission("roles", "update"), updateRole);
rolesRouter.delete("/", withPermission("roles", "delete"), deleteRole);
