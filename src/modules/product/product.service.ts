import { ObjectId } from "mongodb";
import { db } from "../../app/config/db";
import { IProduct } from "./product.interface";

export const productCollection = db.collection<IProduct>("products");

const createProduct = async (payload: IProduct) => {
  const product = {
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: payload.stock > 0,
  };

  const result = await productCollection.insertOne(product);

  return result;
};

const getAllProducts = async (email?: string) => {
  const query = email ? { "farmer.email": email } : {};

  const result = await productCollection.find(query).toArray();

  return result;
};

const getFeaturedProducts = async () => {
  return await productCollection
    .find({
      isAvailable: true,
    })
    .sort({
      createdAt: -1,
    })
    .limit(8)
    .toArray();
};

const getSingleProduct = async (id: string) => {
  const result = await productCollection.findOne({
    _id: new ObjectId(id),
  });

  return result;
};

const updateProduct = async (id: string, payload: Partial<IProduct>) => {
  payload.updatedAt = new Date();

  const result = await productCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: payload,
    },
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
  getFeaturedProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};
