import { db } from "../../app/config/db";
import { ICategory } from "./category.interface";

const categoryCollection = db.collection<ICategory>("categories");

const createCategory = async (payload: ICategory) => {
  const result = await categoryCollection.insertOne({
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return result;
};

const getAllCategories = async () => {
  const result = await categoryCollection.find().toArray();

  return result;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
};
