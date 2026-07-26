import { ObjectId } from "mongodb";
import { db } from "../../app/config/db";
import { IProduct } from "./product.interface";

const productCollection = db.collection<IProduct>("products");

const createProduct = async (payload: IProduct) => {
  const product = {
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await productCollection.insertOne(product);

  return result;
};

const getAllProducts = async (email?: string) => {
  const query = email ? { "farmer.email": email } : {};

  const result = await productCollection.find(query).toArray();

  return result;
};

const getSingleProduct = async (id: string) => {
  const result = await productCollection.findOne({
    _id: new ObjectId(id),
  });

  return result;
};

const updateProduct = async (
  id: string,
  payload: Partial<IProduct>
) => {
  payload.updatedAt = new Date();

  const result = await productCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: payload,
    }
  );

  return result;
};

const deleteProduct = async (id: string) => {
  const result = await productCollection.deleteOne({
    _id: new ObjectId(id),
  });

  return result;
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};