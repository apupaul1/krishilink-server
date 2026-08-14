import { ObjectId } from "mongodb";
import { TOrderStatus } from "../order/order.interface";

export interface ITrackingLog {
  _id?: ObjectId;

  trackingId: string;

  status: TOrderStatus;

  details: string;

  createdAt: Date;
}

