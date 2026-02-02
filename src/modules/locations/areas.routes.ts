import { RequestHandler, Router } from "express";
import {
  createArea,
  deleteArea,
  getAllAreas,
  getAreaById,
  updateArea,
} from "./area.controller";
import { verifyJWT } from "../../shared/middlewares/JTW.middleware";
import { attachPermissionScopes } from "../../shared/middlewares/permission.middleware";
import { Action } from "@prisma/client";

const middlewares = [verifyJWT as RequestHandler];

const withPermission = (resource: string, action: Action): RequestHandler[] => [
  verifyJWT as RequestHandler,
  // attachPermissionScopes(resource, action) as RequestHandler,
];

export const areasRouter: Router = Router();
// prefix /areas
areasRouter.get("/", middlewares, getAllAreas);
areasRouter.post("/", middlewares, createArea);
areasRouter.delete("/:id", withPermission("areas", "delete"), deleteArea);
areasRouter.put("/:id", middlewares, updateArea);
areasRouter.get("/:id", middlewares, getAreaById);
// areasRouter.post("/upsert", middlewares, upsertAreas);
