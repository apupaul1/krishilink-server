import { ObjectId } from "mongodb";
import {
  ICreateFarmerApplication,
  IFarmerApplication,
  TFarmerApplicationStatus,
} from "./farmerApplication.interface";
import { db } from "../../app/config/db";
import { userCollection, UserService } from "../user/user.service";

const farmerCollection = db.collection("farmerCollections");

const createApplication = async (payload: ICreateFarmerApplication) => {
  // Check user exists
  const user = await userCollection.findOne({
    email: payload.email,
  });

  if (!user) {
    throw new Error("User not found.");
  }

  // Already a farmer
  if (user.role === "farmer") {
    throw new Error("You are already a farmer.");
  }

  // Existing pending application
  const existingApplication = await farmerCollection.findOne({
    email: payload.email,
    status: "pending",
  });

  if (existingApplication) {
    throw new Error("Farmer application already exists.");
  }

  const application: IFarmerApplication = {
    ...payload,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await farmerCollection.insertOne(application);

  return application;
};

const getAllApplications = async ({
  status,
  email,
}: {
  status?: TFarmerApplicationStatus;
  email?: string;
}) => {
  const query: Record<string, unknown> = {};

  if (status) query.status = status;

  if (email) query.email = email;

  return await farmerCollection.find(query).sort({ createdAt: -1 }).toArray();
};

const updateApplicationStatus = async (
  id: string,
  payload: Partial<IFarmerApplication>,
) => {
  const application = await farmerCollection.findOne({ _id: new ObjectId(id) });

  if (!application) {
    throw new Error("Farmer not found.");
  }

  const result = await farmerCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    {
      $set: {
        ...payload,
        updatedAt: new Date(),
      },
    },
  );

  if (payload.status === "approved") {
    await UserService.updateUserRole(application.email, "farmer");
  }

  return result;  
};

const deleteApplication = async (id: string) => {
  const result = await farmerCollection.deleteOne({
    _id: new ObjectId(id),
  });

  return result;
};

export const FarmerService = {
  createApplication,
  getAllApplications,
  updateApplicationStatus,
  deleteApplication,
};
