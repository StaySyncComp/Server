import { Router, RequestHandler } from "express";
import { verifyJWTGuest } from "../middlewares/JTW.middleware";
import {
  getGuestInformation,
  listCallGuestCategoriesForAi,
  createGuestCall,
  getOrganizationInformation,
} from "../controllers/guest.controller";

const guestRouter = Router();

const middlewares = [verifyJWTGuest as RequestHandler];
// call categories for the ai
guestRouter.get("/list", middlewares, listCallGuestCategoriesForAi);
guestRouter.get("/", middlewares, getGuestInformation);
guestRouter.post("/call", middlewares, createGuestCall);
guestRouter.get("/organization", middlewares, getOrganizationInformation);
export default guestRouter;
