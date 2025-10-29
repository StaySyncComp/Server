import { Request, Response } from "express";
import { prismaClient } from "../prisma";
import {
  ExtendedRequest,
  ExtendedRequestGuest,
} from "../types/users/usersRequests";
import { generateTokenAndSetCookieDynamic } from "../utils/authUtils";
import fastApiClient from "../utils/fastapiClient";
import asyncHandler from "express-async-handler";

export const upsertAiContext = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { organizationId, fileUrls, contextText } = req.body;
      if (!organizationId) {
        return res.status(400).json({ message: "Missing organizationId" });
      }

      const aiSettings = await prismaClient.aiSettings.upsert({
        where: { organizationId },
        update: {
          fileUrls: fileUrls ?? [],
          contextText,
        },
        create: {
          organizationId,
          fileUrls: fileUrls ?? [],
          contextText,
        },
      });

      res.json({ aiSettings });
    } catch (err) {
      console.error("upsertAiContext error:", err);
      res.status(500).json({ message: "Failed to upsert AI context" });
    }
  }
);

export const fetchAiContext = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { organizationId } = req.query;
      if (!organizationId) {
        return res.status(400).json({ message: "Missing organizationId" });
      }

      const aiSettings = await prismaClient.aiSettings.findUnique({
        where: { organizationId: Number(organizationId) },
      });

      if (!aiSettings) {
        return res.status(404).json({ message: "AI settings not found" });
      }

      res.json(aiSettings);
    } catch (err) {
      console.error("fetchAiContext error:", err);
      res.status(500).json({ message: "Failed to fetch AI context" });
    }
  }
);

export const redirectWithCookie = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<any> => {
    const { locationId, organizationId } = req.query;
    if (!organizationId || !locationId)
      return res
        .status(400)
        .json({ message: "Missing organizationId or locationId" });
    generateTokenAndSetCookieDynamic(
      res,
      {
        locationId: Number(locationId),
        organizationId: Number(organizationId),
      },
      "chat"
    );
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${FRONTEND_URL}/chat`);
  }
);

export const requestAi = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    try {
      const token = req?.token;
      const cookies = req.cookies;
      const response = await fastApiClient.post("/log", req.body, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(cookies
            ? {
                Cookie: Object.entries(cookies)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(";"),
              }
            : {}),
        },
      });

      res.status(response.status).json(response.data);
    } catch (err: any) {
      res.status(err?.response?.status || 500).json({
        error: "Failed to contact AI service",
        details: err?.response?.data || err.message,
      });
    }
  }
);

export const requestGuestAi = asyncHandler(
  async (req: ExtendedRequestGuest, res: Response) => {
    try {
      const token = req?.token;
      const cookies = req.cookies;
      const response = await fastApiClient.post("/guest", req.body, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(cookies
            ? {
                Cookie: Object.entries(cookies)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(";"),
              }
            : {}),
        },
      });
      res.status(response.status).json(response.data);
    } catch (err: any) {
      res.status(err?.response?.status || 500).json({
        error: "Failed to contact AI service",
        details: err?.response?.data || err.message,
      });
    }
  }
);
