import { RequestHandler, Router } from "express";
import {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getUsersWithRoles,
  adminUpdateUser,
  createAdminUser,
} from "../controllers/users.controller";

import { verifyJWT } from "../middlewares/JTW.middleware";
import { attachPermissionScopes } from "../middlewares/permission.middleware";
import { Action } from "@prisma/client";
export const usersRouter: Router = Router();

const middlewares = [verifyJWT as RequestHandler];
const withPermission = (resource: string, action: Action): RequestHandler[] => [
  verifyJWT as RequestHandler,
  attachPermissionScopes(resource, action) as RequestHandler,
];
// for use (ben, yotam, daniel) to use to create with no auth users
usersRouter.post("/base-terminal-creation", createUser);

usersRouter.get("/roles", middlewares, getAllUsers);

usersRouter.post("/", withPermission("users", "create"), createAdminUser);
usersRouter.put("/", withPermission("users", "update"), updateUser);
usersRouter.delete("/:id", withPermission("users", "delete"), deleteUser);
usersRouter.get("/find", middlewares, getUser);
usersRouter.get("/", withPermission("users", "view"), getUsersWithRoles);
usersRouter.put("/:id", withPermission("users", "update"), adminUpdateUser);
