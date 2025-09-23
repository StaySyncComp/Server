// routes/calls/calls.base.routes.ts
import { Router, RequestHandler } from "express";
import { Action } from "@prisma/client";
import {
  getCalls,
  createNewCall,
  updateCall,
  deleteCall,
  getCallMessages,
} from "../../controllers/calls/calls.controller";
import { verifyJWT } from "../../middlewares/JTW.middleware";
import { attachPermissionScopes } from "../../middlewares/permission.middleware";

const router = Router();
const withPermission = (resource: string, action: Action): RequestHandler[] => [
  verifyJWT as RequestHandler,
  attachPermissionScopes(resource, action) as RequestHandler,
];

router.get("/", withPermission("calls", "view"), getCalls);
router.post("/", withPermission("calls", "create"), createNewCall);
router.put("/:id", withPermission("calls", "update"), updateCall);
router.delete("/:id", withPermission("calls", "delete"), deleteCall);
router.get("/:callId/messages", getCallMessages);

export default router;
