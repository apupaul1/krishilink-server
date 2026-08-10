import { ObjectId } from "mongodb";

export type TRiderStatus = "pending" | "approved" | "rejected";

export interface ICreateRider {
  name: string;
  email: string;
  photoURL: string;

  district: string;
  address: string;

  drivingLicense: string;
  nid: string;
  bike: string;
}

export interface IRider extends ICreateRider {
  _id?: ObjectId;
  status: TRiderStatus;
  createdAt: Date;
  updatedAt: Date;
}
