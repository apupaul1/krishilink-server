import { db } from "../../app/config/db";
import { ITrackingLog } from "./tracking.interface";
import { TOrderStatus } from "../order/order.interface";

export const trackingsCollection = db.collection<ITrackingLog>("trackings");

const logTracking = async (trackingId: string, status: TOrderStatus) => {
  const log: ITrackingLog = {
    trackingId,
    status,
    details: status.replaceAll("_", " "),
    createdAt: new Date(),
  };

  return await trackingsCollection.insertOne(log);
};

const getTrackingLogs = async (trackingId: string) => {
  return await trackingsCollection
    .find({ trackingId })
    .sort({ createdAt: 1 })
    .toArray();
};

export const TrackingService = {
  logTracking,
  getTrackingLogs,
};
