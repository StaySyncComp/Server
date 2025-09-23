// utils/permissions/checkScopedAccess.ts

import { ExtendedRequest } from "../types/users/usersRequests";

interface ScopedAccessOptions {
  req: ExtendedRequest;
  resourceDepartmentId?: number | null;
  resourceCreatedById?: string | null;
}

export const checkScopedAccess = ({
  req,
  resourceDepartmentId,
  resourceCreatedById,
}: ScopedAccessOptions): boolean => {
  const { user, permissionScope } = req;
  if (!user || !permissionScope) return false;

  const { scopes } = permissionScope;

  if (scopes.includes("any")) return true;

  const userDepartmentIds = user.organizationRoles
    .map((role) => role.departmentId)
    .filter(Boolean);

  const ownsByDepartment =
    scopes.includes("own") &&
    resourceDepartmentId !== null &&
    resourceDepartmentId !== undefined &&
    userDepartmentIds.includes(resourceDepartmentId as number);

  const ownsByCreatedBy =
    scopes.includes("none") &&
    resourceCreatedById !== null &&
    resourceCreatedById === String(user.id);

  return ownsByDepartment || ownsByCreatedBy;
};
