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
    baseDeliveryCharge: 50,
  };

  const result = await productCollection.insertOne(product);

  return result;
};

const getAllProducts = async (email?: string) => {
  const query = email ? { "farmer.email": email } : {};

  const result = await productCollection
    .find(query)
    .sort({
      createdAt: -1,
    })
    .toArray();

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

const decreaseStock = async (
  items: {
    productId: ObjectId;
    quantity: number;
  }[],
) => {
  for (const item of items) {
    const result = await productCollection.updateOne(
      {
        _id: item.productId,
        stock: {
          $gte: item.quantity,
        },
      },
      [
        {
          $set: {
            stock: {
              $subtract: ["$stock", item.quantity],
            },
            updatedAt: new Date(),
          },
        },
        {
          $set: {
            isAvailable: {
              $gt: ["$stock", 0],
            },
          },
        },
      ],
    );

    if (result.modifiedCount !== 1) {
      throw new Error(`Insufficient stock for product: ${item.productId}`);
    }
  }
};

const increaseStock = async (
  items: {
    productId: ObjectId;
    quantity: number;
  }[],
) => {
  for (const item of items) {
    const result = await productCollection.updateOne(
      {
        _id: item.productId,
      },
      [
        {
          $set: {
            stock: {
              $add: ["$stock", item.quantity],
            },
            updatedAt: new Date(),
          },
        },
        {
          $set: {
            isAvailable: {
              $gt: ["$stock", 0],
            },
          },
        },
      ],
    );

    if (result.modifiedCount !== 1) {
      throw new Error(`Failed to restore stock for product: ${item.productId}`);
    }
  }
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getFeaturedProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  decreaseStock,
  increaseStock,
};
