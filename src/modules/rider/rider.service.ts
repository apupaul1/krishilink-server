import { ObjectId } from "mongodb";
import {
  ICreateFarmerApplication,
  IFarmerApplication,
  TFarmerApplicationStatus,
} from "../farmer/farmer.interface";
import { db } from "../../app/config/db";
import { userCollection, UserService } from "../user/user.service";
import { ICreateRider, IRider, TRiderStatus } from "./rider.interface";

const riderCollection = db.collection("riderCollections");

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

  const application: IRider = {
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
}: {
  status?: TRiderStatus;
  email?: string;
}) => {
  const query: Record<string, unknown> = {};

  if (status) query.status = status;

  if (email) query.email = email;

  return await riderCollection.find(query).sort({ createdAt: -1 }).toArray();
};

const updateRiderStatus = async (
  id: string,
  payload: Partial<IRider>,
) => {
  const application = await riderCollection.findOne({ _id: new ObjectId(id) });

  if (!application) {
    throw new Error("Rider not found.");
  }

  const result = await riderCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    {
      $set: {
        ...payload,
        updatedAt: new Date(),
        workStatus: "available"
      },
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
    deleteRider
};
