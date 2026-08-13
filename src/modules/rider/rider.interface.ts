import { ObjectId } from "mongodb";

export type TRiderStatus = "pending" | "approved" | "rejected";

export type TRiderWorkStatus = "available" | "busy" | "offline";

export interface ICreateRider {
  name: string;
  email: string;
  photoURL: string;

  district: string;
  area: string;
  address: string;

  drivingLicense: string;
  nid: string;
  bike: string;

  status: TRiderStatus;

  createdAt: Date;
  updatedAt: Date;
}

export interface IRider extends ICreateRider {
  _id?: ObjectId;
  workStatus: TRiderWorkStatus;
  status: TRiderStatus;
}
