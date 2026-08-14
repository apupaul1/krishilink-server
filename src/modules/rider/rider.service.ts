import { ObjectId } from "mongodb";
import {
  ICreateFarmerApplication,
  IFarmerApplication,
  TFarmerApplicationStatus,
} from "../farmer/farmer.interface";
import { db } from "../../app/config/db";
import { userCollection, UserService } from "../user/user.service";
import {
  ICreateRider,
  IRider,
  TRiderStatus,
  TRiderWorkStatus,
} from "./rider.interface";

export const riderCollection = db.collection("riders");

const createRider = async (payload: ICreateRider) => {
  // Check user exists
  const user = await userCollection.findOne({
    email: payload.email,
  });

  if (!user) {
    throw new Error("User not found.");
  }

  // Already a farmer
  if (user.role === "rider") {
    throw new Error("You are already a rider.");
  }

  // Existing pending application
  const existingApplication = await riderCollection.findOne({
    email: payload.email,
    status: "pending",
  });

  if (existingApplication) {
    throw new Error("Rider application already exists.");
  }

  const application: ICreateRider = {
    ...payload,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await riderCollection.insertOne(application);

  return application;
};

const getAllRiders = async ({
  status,
  email,
  workStatus,
  district,
  area,
}: {
  status?: TRiderStatus;
  email?: string;
  workStatus?: TRiderWorkStatus;
  district?: string;
  area?: string;
}) => {
  const query: Record<string, unknown> = {};

  if (status) {
    query.status = status;
  }

  if (email) {
    query.email = email;
  }

  if (workStatus) {
    query.workStatus = workStatus;
  }

  if (district) {
    query.district = district;
  }

  if (area) {
    query.area = area;
  }

  return await riderCollection.find(query).sort({ createdAt: -1 }).toArray();
};

const updateRiderStatus = async (id: string, payload: Partial<IRider>) => {
  const application = await riderCollection.findOne({ _id: new ObjectId(id) });

  if (!application) {
    throw new Error("Rider not found.");
  }

  const updateData: Partial<IRider> = {
    ...payload,
    updatedAt: new Date(),
  };

  if (payload.status === "approved") {
    updateData.workStatus = "available";
  }

  const result = await riderCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    {
      $set: updateData,
    },
  );

  if (payload.status === "approved") {
    await UserService.updateUserRole(application.email, "rider");
  }

  return result;
};


const deleteRider = async (id: string) => {
  const result = await riderCollection.deleteOne({
    _id: new ObjectId(id),
  });

  return result;
};

export const RiderService = {
  getAllRiders,
  createRider,
  updateRiderStatus,
  deleteRider,
};
