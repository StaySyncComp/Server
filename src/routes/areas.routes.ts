import { RequestHandler, Router } from "express";
import {
  createArea,
  deleteArea,
  getAllAreas,
  getAreaById,
  updateArea,
} from "../controllers/area.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";
const middlewares = [verifyJWT as RequestHandler];
export const areasRouter: Router = Router();
// prefix /areas
areasRouter.get("/", middlewares, getAllAreas);
areasRouter.post("/", middlewares, createArea);
areasRouter.delete("/", middlewares, deleteArea);
areasRouter.put("/:id", middlewares, updateArea);
areasRouter.get("/:id", middlewares, getAreaById);
// areasRouter.post("/upsert", middlewares, upsertAreas);
