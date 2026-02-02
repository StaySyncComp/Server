import { Router, RequestHandler } from "express";
import {
  getCleaningStates,
  updateStatus,
  assignWorker,
  initializeCleaningStates
} from "./cleaning.controller";
import { verifyJWT } from "../../shared/middlewares/JTW.middleware";

const router = Router();

router.get("/", verifyJWT as unknown as RequestHandler, getCleaningStates);
router.post("/init", verifyJWT as unknown as RequestHandler, initializeCleaningStates); // Admin tool
router.put("/:id/status", verifyJWT as unknown as RequestHandler, updateStatus as unknown as RequestHandler);
router.put("/:id/assign", verifyJWT as unknown as RequestHandler, assignWorker as unknown as RequestHandler);

export default router;
