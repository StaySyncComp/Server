---
name: scaffolding-module
description: Scaffolds a new backend module (Controller, Routes, Service) with CRUD operations, dynamic table support, and permissions. Use when the user asks to "create a new module", "add a resource", or mentions "scaffold" with specific actions.
---

# Module Scaffolding Skill

## When to use this skill

- User wants to create a new resource API (e.g., "create a product module").
- User specifies "CRUD" or specific actions (create, delete, get, update, table).
- User mentions "permissions" or "dynamic table" in the context of a new feature.

## Workflow

1.  **Analyze Requirements**:
    - Determine the **Resource Name** (plural, camelCase, e.g., `products`).
    - Determine the **Prisma Model Name** (PascalCase, e.g., `Product`).
    - Identify requested **Actions** (Create, Read, Update, Delete, List/Table).
    - _Crucial_: Verify if the Prisma Model exists. If not, ask user to create it or create it first.

2.  **Create Directory Structure**:
    - Run: `mkdir src/modules/[resourceName]`

3.  **Generate Controller** (`src/modules/[resourceName]/[resourceName].controller.ts`):
    - Use the **Controller Template** below.
    - Implement "Dynamic Data" for the `GET /` (Table) endpoint if requested.
    - Implement `getScopedResource` for security on ID-based operations.

4.  **Generate Routes** (`src/modules/[resourceName]/[resourceName].routes.ts`):
    - Use the **Routes Template** below.
    - Apply `verifyJWT` and `attachPermissionScopes` middleware.
    - Map standard routes:
      - `GET /` -> `get[Resource]s` (Dynamic Table)
      - `POST /` -> `create[Resource]`
      - `GET /:id` -> `get[Resource]ById`
      - `PUT /:id` -> `update[Resource]`
      - `DELETE /:id` -> `delete[Resource]`

5.  **Register Module**:
    - Edit `src/server.ts`.
    - Import the new router.
    - Add `app.use("/[resourceName]", [resourceName]Router);`.

6.  **Verify**:
    - Run `npx tsc --noEmit` to check for type errors.
    - Check if `schema.prisma` `Resource` enum needs the new resource name added (if strict).

## Templates

### Controller Template (`[resourceName].controller.ts`)

```typescript
import { Request, Response } from "express";
import { prismaClient } from "../../shared/prisma";
import { [ModelName] } from "@prisma/client";
import { ExtendedRequest } from "../../shared/types/users/usersRequests";
import { getScopedResource } from "../../shared/utils/controllerUtils";
import {
  getDynamicData,
  getUpdatedFields,
  getMissingParams,
} from "../../shared/utils/dynamicData";
import asyncHandler from "express-async-handler";

export const create[ModelName] = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    const { /* extract fields */ } = req.body;

    // validation...

    try {
        const item = await prismaClient.[modelName].create({
            data: {
                // data...
                organization: { connect: { id: req.user?.organizationId } }
            }
        });
        res.status(201).json(item);
    } catch (error) {
        console.error("Error creating [ModelName]:", error);
        res.status(500).json({ message: "Server error" });
    }
  }
);

export const get[ModelName]s = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    // Dynamic Table Endpoint
    return getDynamicData(req, res, {
      model: "[modelName]", // Prisma model name (lowercase start)
      searchFields: [
        { path: "name", field: "en" }, // Adjust fields
      ],
      defaultSortField: "createdAt",
    });
  }
);

export const get[ModelName]ById = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    return getScopedResource<[ModelName]>({
      model: "[modelName]",
      where: { id: Number(req.params.id) },
      req,
      res,
      extractDepartmentIds: (item) => [], // Adjust if department exists
      resourceName: "[ModelName]",
    });
  }
);

export const update[ModelName] = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
     const { id } = req.params;
     // Retrieve first to check scope
     const existing = await getScopedResource<[ModelName]>({
      model: "[modelName]",
      where: { id: Number(id) },
      req,
      res,
      extractDepartmentIds: (item) => [],
      resourceName: "[ModelName]",
    });
    if (!existing) return;

    const updates = getUpdatedFields(existing, req.body);
    if (Object.keys(updates).length === 0) return res.status(200).json({ message: "No changes" });

    const updated = await prismaClient.[modelName].update({
        where: { id: Number(id) },
        data: updates
    });
    res.status(200).json(updated);
  }
);

export const delete[ModelName] = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
     const { id } = req.params;
     // Retrieve first to check scope
     const existing = await getScopedResource<[ModelName]>({
      model: "[modelName]",
      where: { id: Number(id) },
      req,
      res,
      extractDepartmentIds: (item) => [],
      resourceName: "[ModelName]",
    });
    if (!existing) return;

    await prismaClient.[modelName].delete({ where: { id: Number(id) } });
    res.status(200).json({ message: "Deleted successfully" });
  }
);
```

### Routes Template (`[resourceName].routes.ts`)

```typescript
import { Router, RequestHandler } from "express";
import { verifyJWT } from "../../shared/middlewares/JTW.middleware";
import { attachPermissionScopes } from "../../shared/middlewares/permission.middleware";
import { Action } from "@prisma/client";
import {
  create[ModelName],
  get[ModelName]s,
  get[ModelName]ById,
  update[ModelName],
  delete[ModelName],
} from "./[resourceName].controller";

const router = Router();
// Helper for readable permission middleware
const withPermission = (resource: string, action: Action): RequestHandler[] => [
  verifyJWT as RequestHandler,
  attachPermissionScopes(resource, action) as RequestHandler,
];

// Routes
// Table / List
router.get("/", withPermission("[resourceName]", "view"), get[ModelName]s);

// Create
router.post("/", withPermission("[resourceName]", "create"), create[ModelName]);

// Sub-resource (Single Item)
router.get("/:id", withPermission("[resourceName]", "view"), get[ModelName]ById);
router.put("/:id", withPermission("[resourceName]", "update"), update[ModelName]);
router.delete("/:id", withPermission("[resourceName]", "delete"), delete[ModelName]);

export const [resourceName]Router = router;
```
