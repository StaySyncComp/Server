import { Router, RequestHandler } from "express";
import {
  fetchAiContext,
  upsertAiContext,
  requestAi,
  redirectWithCookie,
  requestGuestAi,
} from "../controllers/ai.controller";
import { verifyJWT, verifyJWTGuest } from "../middlewares/JTW.middleware";
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
aiRouter.post("/request", verifyJWT as RequestHandler, requestAi);
aiRouter.get(
  "/request-guest",
  verifyJWTGuest as RequestHandler,
  requestGuestAi
);

aiRouter.get("/guest", redirectWithCookie);
