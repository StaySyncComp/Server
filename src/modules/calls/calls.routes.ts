import { Router } from "express";
import baseRoutes from "./calls.base.routes";
import categoryRoutes from "./categories/categories.routes";
import recurringRoutes from "./recurring/recurring.routes";

export const callsRouter = Router();

callsRouter.use("/", baseRoutes);
callsRouter.use("/categories", categoryRoutes);
callsRouter.use("/recurring", recurringRoutes);
