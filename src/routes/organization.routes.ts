import { RequestHandler, Router } from "express";
import {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization,
  getOrganizationRole,
} from "../controllers/organization.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";
export const organizationRouter: Router = Router();
const middlewares = [verifyJWT as RequestHandler];
organizationRouter.post("/", middlewares, createOrganization);
organizationRouter.get("/", middlewares, getOrganizations);
organizationRouter.put("/:id", middlewares, updateOrganization);
organizationRouter.get("/role", middlewares, getOrganizationRole);
organizationRouter.get("/find", middlewares, getOrganization);
