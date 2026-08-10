import { Request, Response } from "express";
import { sendResponse } from "../../app/utils/sendResponse";
import { userCollection } from "../user/user.service";
import { RiderService } from "./rider.service";

type ApplicationParams = {
  id: string;
};

const createRider = async (req: Request, res: Response) => {
  const result = await RiderService.createRider(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Farmer application submitted successfully.",
    data: result,
  });
};

const getAllRiders = async (req: Request, res: Response) => {
  const { status, email } = req.query;

  // if (email !== req.user.email) {
  //   const currentUser = await userCollection.findOne({
  //     email: req.user.email,
  //   });
  // }

  const result = await RiderService.getAllRiders({
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

const updateRider = async (req: Request<ApplicationParams>, res: Response) => {
  const result = await RiderService.updateRiderStatus(req.params.id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Application updated successfully.",
    data: result,
  });
};

const deleteRider = async (req: Request<ApplicationParams>, res: Response) => {
  const result = await RiderService.deleteRider(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Application deleted successfully.",
    data: result,
  });
};

export const RiderController = {
  getAllRiders,
  createRider,
  updateRider,
  deleteRider,
};
