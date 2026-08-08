import { Request, Response } from "express";
import { FarmerService } from "./farmerApplication.service";
import { sendResponse } from "../../app/utils/sendResponse";
import { userCollection } from "../user/user.service";

type ApplicationParams = {
  id: string;
};

const createApplication = async (req: Request, res: Response) => {
  const result = await FarmerService.createApplication(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Farmer application submitted successfully.",
    data: result,
  });
};

const getAllApplications = async (req: Request, res: Response) => {
  const { status, email } = req.query;

  if (email !== req.user.email) {
    const currentUser = await userCollection.findOne({
      email: req.user.email
    });
  }

  const result = await FarmerService.getAllApplications({
    status: status as "pending" | "approved" | "rejected" | undefined,

    email: email as string | undefined,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Applications retrieved successfully.",
    data: result,
  });
};

const updateApplication = async (
  req: Request<ApplicationParams>,
  res: Response,
) => {
  const result = await FarmerService.updateApplicationStatus(
    req.params.id,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Application updated successfully.",
    data: result,
  });
};

const deleteApplication = async (
  req: Request<ApplicationParams>,
  res: Response,
) => {
  const result = await FarmerService.deleteApplication(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Application deleted successfully.",
    data: result,
  });
};

export const FarmerController = {
  createApplication,
  getAllApplications,
  updateApplication,
  deleteApplication,
};
