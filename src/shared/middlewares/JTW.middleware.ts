import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prismaClient } from "../prisma";
import {
  ExtendedRequest,
  ExtendedRequestGuest,
} from "../types/users/usersRequests";
import { parseCookies } from "../utils/tokenUtils";
import { Socket } from "socket.io";

export const verifyJWT = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(req.originalUrl);

    const token = req.cookies?.access_token || req.headers?.authorization;

    if (!token) return res.status(401).json({ message: "Unauthorized JWT" });

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      return res.status(500).json({
        message: "Internal Server Error: Missing access token secret",
      });
    }
    const orgId = req.query?.organizationId;

    jwt.verify(token, secret, async (err: any, decoded: any) => {
      if (err)
        return res.status(403).json({ message: "Forbidden: Invalid Token" });

      const userId = decoded.UserInfo?.id;
      if (!userId)
        return res.status(401).json({ message: "Unauthorized: No user ID" });

      const user = await prismaClient.user.findUnique({
        where: { id: userId },
        include: {
          organizationRoles: orgId
            ? { where: { organizationId: Number(orgId) } }
            : true,
        },
      });
      if (!user) return res.status(404).json({ message: "User not found" });
      req.token = token;
      req.user = {
        id: userId,
        email: user.email,
        name: decoded.UserInfo?.name,
        username: decoded.UserInfo?.username,
        organizationRoles: user?.organizationRoles,
      };

      next();
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: any) => void
) => {
  try {
    const cookieHeader = socket.handshake.headers?.cookie;
    let cookieToken;
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      cookieToken = cookies["access_token"];
    }
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization ||
      cookieToken;
    const orgId = socket.handshake.auth?.organizationId;
    if (!orgId) return console.log("Missing organizationId in query");

    if (!token) {
      const err = new Error("Unauthorized: No token provided");
      (err as any).data = { code: 401, message: "Unauthorized" };
      return next(err);
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      const err = new Error("Server error: Missing secret");
      (err as any).data = { code: 500, message: "Internal server error" };
      return next(err);
    }

    jwt.verify(token, secret, async (err: any, decoded: any) => {
      if (err) {
        const authErr = new Error("Forbidden: Invalid token");
        (authErr as any).data = { code: 403, message: "Forbidden" };
        return next(authErr);
      }
      if (!orgId || isNaN(orgId)) {
        return console.log("Missing or invalid organizationId in query");
      }
      const userId = decoded.UserInfo?.id;
      if (!userId || !orgId) {
        const authErr = new Error("Unauthorized: No user ID");
        (authErr as any).data = { code: 401, message: "Unauthorized" };
        return next(authErr);
      }
      console.log(orgId, "orgId");

      const user = await prismaClient.user.findUnique({
        where: { id: userId },
        include: {
          organizationRoles: orgId
            ? { where: { organizationId: Number(orgId) } }
            : true,
        },
      });

      if (!user) {
        const notFoundErr = new Error("User not found");
        (notFoundErr as any).data = { code: 404, message: "User not found" };
        return next(notFoundErr);
      }

      socket.data.user = {
        id: userId,
        email: user.email,
        name: decoded.UserInfo?.name,
        username: decoded.UserInfo?.username,
        organizationRoles: user.organizationRoles,
        currentOrganizationId: orgId,
      };

      next();
    });
  } catch (err) {
    console.error("Socket auth error:", err);
    const internalErr = new Error("Internal server error");
    (internalErr as any).data = { code: 500, message: "Internal server error" };
    next(internalErr);
  }
};

export const verifyJWTGuest = async (
  req: ExtendedRequestGuest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.chat || req.headers?.authorization_chat;
    if (!token)
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret)
      return res.status(500).json({
        message: "Internal Server Error: Missing access token secret",
      });

    jwt.verify(token, secret, async (err: any, decoded: any) => {
      if (err)
        return res.status(403).json({ message: "Forbidden: Invalid Token" });
      console.log(decoded, "decoded");
      req.token = token;
      req.user = {
        locationId: decoded?.locationId,
        organizationId: decoded?.organizationId,
      };

      next();
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
