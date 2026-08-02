import { ICreateUser, IUpdateUser, IUser } from "./user.interface";
import { db } from "../../app/config/db";
import { ObjectId } from "mongodb";

const userCollection = db.collection<IUser>("users");

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
    updatedAt: new Date()
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

const updateUser = async (
  id: string,
  payload: IUpdateUser,
) => {
  const result = await userCollection.findOneAndUpdate(
    {
      _id: new ObjectId(id),
    },
    {
      $set: {
        ...payload,
        updatedAt: new Date(),
      },
    },
    {
      returnDocument: "after",
    },
  );

  return result;
};

const deleteUser = async (id: string) => {
  return await userCollection.findOneAndDelete({
    _id: new ObjectId(id),
  });
};

export const UserService = {
  createUser,
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
};