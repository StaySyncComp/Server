import { Request } from "express";
export interface Permission {
  resource: string;
  action: string;
  scope: "any" | "own" | "none";
}

export interface OrganizationRoleInfo {
  id: number;
  userId: number;
  organizationId: number;
  departmentId: number | null;
  roleId: number;
}

export interface JWTUserInfo {
  id: number;
  email: string;
  name: string;
  username: string;
}

export interface JWTGuestInfo {
  locationId: number | null;
  organizationId: number | null;
}
export interface ExtendedRequestGuest extends Request {
  user?: JWTGuestInfo;
  token?: string;
}
export interface ExtendedRequest extends Request {
  token?: string;
  user?: JWTUserInfo & { organizationRoles: OrganizationRoleInfo[] };
  id?: number;
  query: {
    id: string;
    organizationId?: string;
    departmentId?: string;
    roleId?: string;
    page?: string;
    pageSize?: string;
    search?: string;
    sortField?: string;
    sortDirection?: "asc" | "desc";
    [key: string]: string | undefined;
  };
  permissionScope?: {
    resource: string;
    action: string;
    scopes: ("any" | "own" | "none")[];
  };
}
export interface CreateUserRequest {
  username: string;
  name: string;
  email: string;
  userType: "EMPLOYER" | "EMPLOYEE";
  password: string;
  organizationId: number;
  role: string;
  logo?: string;
}
