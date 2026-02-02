import { Router, RequestHandler } from "express";
import { Action } from "@prisma/client";

import {
  verifyJWT,
  verifyJWTGuest,
} from "../../../shared/middlewares/JTW.middleware";
import { attachPermissionScopes } from "../../../shared/middlewares/permission.middleware";
import {
  createNewCallCategory,
  getCallCategories,
  deleteCategory,
  updateCategory,
  upsertCallCategories,
  listCallCategoriesForAi,
  getCallCategory,
} from "./categories.controller";

const router = Router();
const withPermission = (resource: string, action: Action): RequestHandler[] => [
  verifyJWT as RequestHandler,
  attachPermissionScopes(resource, action) as RequestHandler,
];

router.post(
  "/",
  withPermission("callCategories", "create"),
  createNewCallCategory,
);
router.get("/", withPermission("callCategories", "view"), getCallCategories);
router.get(
  "/list",
  withPermission("callCategories", "view"),
  listCallCategoriesForAi,
);

router.delete(
  "/:id",
  withPermission("callCategories", "delete"),
  deleteCategory,
);
router.put("/:id", withPermission("callCategories", "update"), updateCategory);
router.post(
  "/upsert",
  withPermission("callCategories", "update"),
  upsertCallCategories,
);

router.get("/:id", withPermission("callCategories", "view"), getCallCategory);

export default router;
