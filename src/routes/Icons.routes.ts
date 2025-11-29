import { RequestHandler, Router } from "express";
import { verifyJWT, verifyJWTGuest } from "../middlewares/JTW.middleware";
import { getIcons } from "../controllers/Icons.controller";
export const IconsRouter = Router();

IconsRouter.get("/", getIcons);
