import { Router, RequestHandler } from "express";
import {
  getAverageCloseTime,
  getTopClosers,
  getCallsByCategory,
  getStatusPie,
  getDashboardStats,
  getUrgentIssues,
  getDepartmentPerformance,
  getPeakHours,
} from "../controllers/reports.controller";
import { verifyJWT } from "../middlewares/JTW.middleware";

export const reportsRouter: Router = Router();

// Legacy routes
reportsRouter.get("/averageCloseTime", verifyJWT as RequestHandler, getAverageCloseTime);
reportsRouter.get("/topClosers", verifyJWT as RequestHandler, getTopClosers);
reportsRouter.get("/callsByCategory", verifyJWT as RequestHandler, getCallsByCategory);
reportsRouter.get("/statusPie", verifyJWT as RequestHandler, getStatusPie);

// New dashboard routes
reportsRouter.get("/dashboard-stats", verifyJWT as RequestHandler, getDashboardStats);
reportsRouter.get("/urgent-issues", verifyJWT as RequestHandler, getUrgentIssues);
reportsRouter.get("/department-performance", verifyJWT as RequestHandler, getDepartmentPerformance);
reportsRouter.get("/peak-hours", verifyJWT as RequestHandler, getPeakHours);
