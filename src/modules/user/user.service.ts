import { ICreateUser, IUpdateUser, IUser, TRole } from "./user.interface";
import { db } from "../../app/config/db";
import { ObjectId } from "mongodb";

export const userCollection = db.collection<IUser>("users");

const createUser = async (payload: ICreateUser) => {
  
  const existingUser = await userCollection.findOne({
    email: payload.email,
  });

  if (existingUser) {
    return existingUser;
  }

  const user: IUser = {
    ...payload,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await userCollection.insertOne(user);

  return user;
};

const getUsers = async () => {
  return await userCollection.find().toArray();
};

const getSingleUser = async (email: string) => {
  return await userCollection.findOne({ email });
};

const updateUser = async (id: string, payload: IUpdateUser) => {
  const result = await userCollection.updateOne(
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

  return result;
};

const deleteUser = async (id: string) => {
  return await userCollection.deleteOne({
    _id: new ObjectId(id),
  });
};

const getUserRole = async (email: string) => {
  const result = await userCollection.findOne({ email: email });

  return result?.role;
};

const updateUserRole = async (email: string, role: TRole) => {
  const result = await userCollection.updateOne(
    {
      email,
    },
    {
      $set: {
        role,
      },
    },
  );

  return result;
};

export const UserService = {
  createUser,
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  getUserRole,
  updateUserRole,
};
