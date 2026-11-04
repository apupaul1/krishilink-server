import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import { sendResponse } from "../../app/utils/sendResponse";

/**
 * Reads the authenticated user's email from the verified Firebase token.
 * Dashboard data is always scoped to the caller, so a user can never read
 * another user's dashboard by passing an arbitrary email in the query string.
 */
const getAuthenticatedEmail = (req: Request) => {
  const email = req.user?.email;

  if (!email) {
    const error = new Error(
      "Authenticated user email is missing from the token.",
    ) as Error & { statusCode?: number };

    error.statusCode = 401;

    throw error;
  }

  return email;
};

const getDashboardOverview = async (req: Request, res: Response) => {
  const email = getAuthenticatedEmail(req);

  const result = await DashboardService.getDashboardOverview(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard overview retrieved successfully.",
    data: result,
  });
};

const getAdminDashboard = async (req: Request, res: Response) => {
  const result = await DashboardService.getAdminDashboard();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin dashboard data retrieved successfully.",
    data: result,
  });
};

const getFarmerDashboard = async (req: Request, res: Response) => {
  const email = getAuthenticatedEmail(req);

  const result = await DashboardService.getFarmerDashboard(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Farmer dashboard data retrieved successfully.",
    data: result,
  });
};

const getRiderDashboard = async (req: Request, res: Response) => {
  const email = getAuthenticatedEmail(req);

  const result = await DashboardService.getRiderDashboard(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rider dashboard data retrieved successfully.",
    data: result,
  });
};

const getUserDashboard = async (req: Request, res: Response) => {
  const email = getAuthenticatedEmail(req);

  const result = await DashboardService.getUserDashboard(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Customer dashboard data retrieved successfully.",
    data: result,
  });
};

export const DashboardController = {
  getDashboardOverview,
  getAdminDashboard,
  getFarmerDashboard,
  getRiderDashboard,
  getUserDashboard,
};
