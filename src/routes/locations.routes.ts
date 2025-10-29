import { Router, RequestHandler } from "express";
import {
  createLocation,
  getAllLocations,
  getLocationsByAreaId,
  getLocations,
  deleteLocation,
  updateLocation,
  upsertLocations,
  listLocationsForAi,
} from "../controllers/location.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";

const middlewares = [verifyJWT as RequestHandler];
export const locationRouter = Router();

locationRouter.get("/", middlewares, getLocations);
locationRouter.get("/all", middlewares, getAllLocations);
locationRouter.get("/list", listLocationsForAi);
locationRouter.get("/:areaId", middlewares, getLocationsByAreaId);
locationRouter.post("/", middlewares, createLocation);
locationRouter.delete("/:id", middlewares, deleteLocation);
locationRouter.put("/:id", middlewares, updateLocation);
locationRouter.post("/upsert", middlewares, upsertLocations);
