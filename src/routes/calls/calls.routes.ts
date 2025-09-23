import { Router } from "express";
import baseRoutes from "./calls.base.routes";
import categoryRoutes from "./calls.categories.routes";
import recurringRoutes from "./calls.recurring.routes";

export const callsRouter = Router();

callsRouter.use("/", baseRoutes);
callsRouter.use("/categories", categoryRoutes);
callsRouter.use("/recurring", recurringRoutes);
