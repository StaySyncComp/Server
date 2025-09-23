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
import { asyncHandler } from "../utils/asyncHandler";

const middlewares = [verifyJWT as RequestHandler];
export const locationRouter = Router();

locationRouter.get("/", middlewares, asyncHandler(getLocations));
locationRouter.get("/all", middlewares, asyncHandler(getAllLocations));
locationRouter.get("/list", listLocationsForAi);
locationRouter.get("/:areaId", middlewares, asyncHandler(getLocationsByAreaId));
locationRouter.post("/", middlewares, asyncHandler(createLocation));
locationRouter.delete("/:id", middlewares, asyncHandler(deleteLocation));
locationRouter.put("/:id", middlewares, asyncHandler(updateLocation));
locationRouter.post("/upsert", middlewares, asyncHandler(upsertLocations));
