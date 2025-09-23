import { Router, RequestHandler } from "express";
import { verifyJWT } from "../../middlewares/JTW.middleware";
import {
  getRecurringCalls,
  createRecurringCall,
  deleteRecurringCall,
  updateRecurringCall,
} from "../../controllers/calls/calls.recurring.controller";

const router = Router();

router.get("/", verifyJWT as RequestHandler, getRecurringCalls);
router.post("/", verifyJWT as RequestHandler, createRecurringCall);
router.delete("/:id", verifyJWT as RequestHandler, deleteRecurringCall);
router.put("/:id", verifyJWT as RequestHandler, updateRecurringCall);

export default router;
