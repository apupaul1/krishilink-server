import { Request, Response } from "express";
import { TrackingService } from "./tracking.service";
import { sendResponse } from "../../app/utils/sendResponse";

const getTrackingLogs = async (req: Request, res: Response) => {
  const { trackingId } = req.params;

  if (typeof trackingId !== "string") {
    throw new Error("Invalid tracking ID.");
  }

  const result = await TrackingService.getTrackingLogs(trackingId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tracking information retrieved successfully.",
    data: result,
  });
};

export const TrackingController = {
  getTrackingLogs,
};
