import { Router, RequestHandler } from "express";
import {
  fetchAiContext,
  upsertAiContext,
  redirectWithCookie,
} from "../controllers/ai.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";
import { asyncHandler } from "../utils/asyncHandler";

export const aiRouter = Router();

aiRouter.get(
  "/context",
  verifyJWT as RequestHandler,
  asyncHandler(fetchAiContext)
);
aiRouter.post(
  "/upsert-context",
  verifyJWT as RequestHandler,
  asyncHandler(upsertAiContext)
);

aiRouter.get("/guest", redirectWithCookie);
