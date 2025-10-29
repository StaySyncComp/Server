import { Router, RequestHandler } from "express";
import {
  fetchAiContext,
  upsertAiContext,
  requestAi,
  redirectWithCookie,
  requestGuestAi,
} from "../controllers/ai.controller";
import { verifyJWT, verifyJWTGuest } from "../middlewares/JTW.middleware";

export const aiRouter = Router();

aiRouter.get("/context", verifyJWT as RequestHandler, fetchAiContext);
aiRouter.post("/upsert-context", verifyJWT as RequestHandler, upsertAiContext);
aiRouter.post("/request", verifyJWT as RequestHandler, requestAi);
aiRouter.post(
  "/request-guest",
  verifyJWTGuest as RequestHandler,
  requestGuestAi
);

aiRouter.get("/guest", redirectWithCookie);
