import { Request, Response } from "express";
import { prismaClient } from "../prisma";
import { ExtendedRequest } from "../types/users/usersRequests";
import asyncHandler from "express-async-handler";

export const getAverageCloseTime = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<void> => {
    const { organizationId } = req.query;

    if (!organizationId) {
      res.status(400).json({ message: "Missing organizationId" });
      return;
    }

    try {
      const calls = await prismaClient.call.findMany({
        where: {
          organizationId: Number(organizationId),
          closedAt: { not: null },
        },
        select: {
          createdAt: true,
          closedAt: true,
        },
      });

      const diffsInMinutes = calls
        .map((c) =>
          c.closedAt && c.createdAt
            ? (new Date(c.closedAt).getTime() -
                new Date(c.createdAt).getTime()) /
              60000
            : null
        )
        .filter((v): v is number => v !== null);

      const avg = diffsInMinutes.length
        ? diffsInMinutes.reduce((sum, v) => sum + v, 0) / diffsInMinutes.length
        : 0;

      res.status(200).json(avg.toFixed(1));
      return;
    } catch (error) {
      console.error("Error in getAverageCloseTime:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getTopClosers = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<void> => {
    const { organizationId } = req.query;

    if (!organizationId) {
      res.status(400).json({ message: "Missing organizationId" });
      return;
    }

    try {
      const data = await prismaClient.call.groupBy({
        by: ["closedById"],
        where: {
          organizationId: Number(organizationId),
          closedById: { not: null },
        },
        _count: true,
        orderBy: {
          _count: {
            closedById: "desc",
          },
        },
        take: 5,
      });

      const users = await prismaClient.user.findMany({
        where: { id: { in: data.map((d) => d.closedById!) } },
      });

      const result = data.map((entry) => {
        const user = users.find((u) => u.id === entry.closedById);
        return {
          name: user?.name || "Unknown",
          value: Number(entry._count.toString()) || 0,
        };
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getTopClosers:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getCallsByCategory = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<void> => {
    const { organizationId } = req.query;

    if (!organizationId) {
      res.status(400).json({ message: "Missing organizationId" });
      return;
    }

    try {
      const categories = await prismaClient.callCategory.findMany({
        where: { organizationId: Number(organizationId) },
      });

      const data = await Promise.all(
        categories.map(async (cat) => {
          const count = await prismaClient.call.count({
            where: { callCategoryId: cat.id },
          });

          const name =
            typeof cat.name === "object"
              ? //@ts-ignore
                cat.name.he || cat.name.en || cat.name.ar || "Unknown"
              : "Unknown";

          return {
            name,
            value: count,
          };
        })
      );

      res.status(200).json(data);
    } catch (error) {
      console.error("Error in getCallsByCategory:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getStatusPie = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<void> => {
    const { organizationId } = req.query;

    if (!organizationId) {
      res.status(400).json({ message: "Missing organizationId" });
      return;
    }

    try {
      const statuses = [
        "OPENED",
        "IN_PROGRESS",
        "COMPLETED",
        "FAILED",
        "ON_HOLD",
      ];
      const data = await Promise.all(
        statuses.map(async (status) => {
          const count = await prismaClient.call.count({
            where: {
              organizationId: Number(organizationId),
              status: status as any,
            },
          });
          return { name: status, value: count };
        })
      );

      res.status(200).json(data);
    } catch (error) {
      console.error("Error in getStatusPie:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getDashboardStats = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<void> => {
    const { organizationId } = req.query;

    if (!organizationId) {
      res.status(400).json({ message: "Missing organizationId" });
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Total calls today
      const totalCallsToday = await prismaClient.call.count({
        where: {
          organizationId: Number(organizationId),
          createdAt: { gte: today },
        },
      });

      // Total calls yesterday
      const totalCallsYesterday = await prismaClient.call.count({
        where: {
          organizationId: Number(organizationId),
          createdAt: { gte: yesterday, lt: today },
        },
      });

      // Average resolution time (in minutes)
      const closedCalls = await prismaClient.call.findMany({
        where: {
          organizationId: Number(organizationId),
          closedAt: { not: null },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
        },
        select: { createdAt: true, closedAt: true },
      });

      const avgResolutionMinutes =
        closedCalls.length > 0
          ? closedCalls.reduce((sum, call) => {
              if (call.closedAt) {
                return (
                  sum +
                  (new Date(call.closedAt).getTime() -
                    new Date(call.createdAt).getTime()) /
                    (1000 * 60)
                );
              }
              return sum;
            }, 0) / closedCalls.length
          : 0;

      // Staff response rate (calls assigned vs total calls today)
      const assignedCallsToday = await prismaClient.call.count({
        where: {
          organizationId: Number(organizationId),
          createdAt: { gte: today },
          assignedToId: { not: null },
        },
      });

      const staffResponseRate =
        totalCallsToday > 0 ? (assignedCallsToday / totalCallsToday) * 100 : 0;

      // Mock guest satisfaction (in real system, you'd get this from surveys/ratings)
      const completedCalls = await prismaClient.call.count({
        where: {
          organizationId: Number(organizationId),
          status: "COMPLETED",
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
      });

      const guestSatisfaction =
        completedCalls > 10 ? 4.6 + Math.random() * 0.4 : 4.5;

      // Calculate changes
      const callsChange =
        totalCallsYesterday > 0
          ? `${totalCallsToday > totalCallsYesterday ? "+" : ""}${(
              ((totalCallsToday - totalCallsYesterday) / totalCallsYesterday) *
              100
            ).toFixed(0)}%`
          : "+100%";

      res.status(200).json({
        totalCallsToday,
        avgResolutionTime: `${Math.round(avgResolutionMinutes)}m`,
        staffResponseRate: Math.round(staffResponseRate),
        guestSatisfaction: Number(guestSatisfaction.toFixed(1)),
        changes: {
          totalCallsToday: callsChange,
          avgResolutionTime: "-5m",
          staffResponseRate: "+2%",
          guestSatisfaction: "+0.2",
        },
      });
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getUrgentIssues = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<void> => {
    const { organizationId } = req.query;

    if (!organizationId) {
      res.status(400).json({ message: "Missing organizationId" });
      return;
    }

    try {
      const urgentCalls = await prismaClient.call.findMany({
        where: {
          organizationId: Number(organizationId),
          status: { in: ["OPENED", "IN_PROGRESS"] },
        },
        include: {
          location: { select: { name: true, roomNumber: true, area: true } },
          callCategory: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 3,
      });

      const issues = urgentCalls.map((call) => {
        const timeAgo = Math.floor(
          (Date.now() - new Date(call.createdAt).getTime()) / (1000 * 60)
        );
        const categoryName =
          typeof call.callCategory?.name === "object"
            ? (call.callCategory.name as any).he ||
              (call.callCategory.name as any).en ||
              "Issue"
            : "Issue";

        const locationName =
          typeof call.location?.name === "object"
            ? (call.location.name as any).he ||
              (call.location.name as any).en ||
              "Unknown"
            : call.location?.name || "Unknown";

        const roomInfo = call.location?.roomNumber
          ? ` ${call.location.roomNumber}`
          : "";

        return {
          id: call.id,
          title: categoryName,
          location: `${locationName}${roomInfo}`,
          timeAgo: `${timeAgo} minutes ago`,
          priority:
            timeAgo > 60
              ? "high"
              : timeAgo > 30
              ? "medium"
              : ("low" as "high" | "medium" | "low"),
        };
      });

      res.status(200).json(issues);
    } catch (error) {
      console.error("Error in getUrgentIssues:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getDepartmentPerformance = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<void> => {
    const { organizationId } = req.query;

    if (!organizationId) {
      res.status(400).json({ message: "Missing organizationId" });
      return;
    }

    try {
      const departments = await prismaClient.department.findMany({
        where: { organizationId: Number(organizationId) },
      });

      const performance = await Promise.all(
        departments.map(async (dept) => {
          const totalCalls = await prismaClient.call.count({
            where: { departmentId: dept.id },
          });

          const completedCalls = await prismaClient.call.count({
            where: {
              departmentId: dept.id,
              status: "COMPLETED",
            },
          });

          const completionRate =
            totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;

          const departmentName =
            typeof dept.name === "object"
              ? (dept.name as any).he || (dept.name as any).en || "Department"
              : dept.name || "Department";

          return {
            name: departmentName,
            completionRate: Math.round(completionRate),
            color:
              completionRate > 95
                ? "green"
                : completionRate > 85
                ? "blue"
                : "purple",
          };
        })
      );

      res
        .status(200)
        .json(
          performance
            .sort((a, b) => b.completionRate - a.completionRate)
            .slice(0, 3)
        );
    } catch (error) {
      console.error("Error in getDepartmentPerformance:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export const getPeakHours = asyncHandler(
  async (req: ExtendedRequest, res: Response): Promise<void> => {
    const { organizationId } = req.query;

    if (!organizationId) {
      res.status(400).json({ message: "Missing organizationId" });
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const calls = await prismaClient.call.findMany({
        where: {
          organizationId: Number(organizationId),
          createdAt: { gte: today },
        },
        select: { createdAt: true },
      });

      // Group calls by 2-hour periods
      const hourlyData: { [key: string]: number } = {
        "8:00 - 10:00 AM": 0,
        "10:00 - 12:00 PM": 0,
        "12:00 - 2:00 PM": 0,
        "2:00 - 4:00 PM": 0,
        "4:00 - 6:00 PM": 0,
        "6:00 - 8:00 PM": 0,
      };

      calls.forEach((call) => {
        const hour = new Date(call.createdAt).getHours();
        if (hour >= 8 && hour < 10) hourlyData["8:00 - 10:00 AM"]++;
        else if (hour >= 10 && hour < 12) hourlyData["10:00 - 12:00 PM"]++;
        else if (hour >= 12 && hour < 14) hourlyData["12:00 - 2:00 PM"]++;
        else if (hour >= 14 && hour < 16) hourlyData["2:00 - 4:00 PM"]++;
        else if (hour >= 16 && hour < 18) hourlyData["4:00 - 6:00 PM"]++;
        else if (hour >= 18 && hour < 20) hourlyData["6:00 - 8:00 PM"]++;
      });

      const maxCalls = Math.max(...Object.values(hourlyData));

      const peakHours = Object.entries(hourlyData).map(
        ([timeRange, callCount]) => ({
          timeRange,
          callCount,
          percentage:
            maxCalls > 0 ? Math.round((callCount / maxCalls) * 100) : 0,
        })
      );

      res.status(200).json(peakHours);
    } catch (error) {
      console.error("Error in getPeakHours:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);
