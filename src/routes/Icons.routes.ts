import { RequestHandler, Router } from "express";
import { verifyJWTGuest } from "../middlewares/JTW.middleware";
import { getIcons } from "../controllers/Icons.controller";
const middlewares = [verifyJWTGuest as RequestHandler];
export const IconsRouter = Router();

IconsRouter.get("/", middlewares, getIcons);
