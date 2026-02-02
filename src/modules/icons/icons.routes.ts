import { RequestHandler, Router } from "express";
import {
  verifyJWT,
  verifyJWTGuest,
} from "../../shared/middlewares/JTW.middleware";
import { getIcons } from "./icons.controller";
export const IconsRouter = Router();

IconsRouter.get("/", getIcons);
