import { ObjectId } from "mongodb";
import { db } from "../../app/config/db";
import { ICreateOrder, IOrder, IOrderProduct } from "./order.interface";
import { productCollection } from "../product/product.service";

export const orderCollection = db.collection("orders");

const createOrder = async (
  email: string,
  payload: ICreateOrder,
) => {
  const {
    products,
    shippingAddress,
    paymentMethod,
  } = payload;

  if (!products || products.length === 0) {
    throw new Error("No products found.");
  }

  const productIds = products.map((item) => {
    if (!ObjectId.isValid(item.productId)) {
      throw new Error(
        `Invalid product ID: ${item.productId}`,
      );
    }

    return new ObjectId(item.productId);
  });

  const dbProducts = await productCollection
    .find({
      _id: {
        $in: productIds,
      },
    })
    .toArray();

  if (dbProducts.length !== products.length) {
    throw new Error(
      "One or more products were not found.",
    );
  }

  const orderItems = products.map((item) => {
    const product = dbProducts.find(
      (product) =>
        product._id.toString() === item.productId,
    );

    if (!product) {
      throw new Error("Product not found.");
    }

    if (item.quantity <= 0) {
      throw new Error("Invalid product quantity.");
    }

    return {
      productId: product._id,
      farmerId: product.farmer.email,
      quantity: item.quantity,
      price: product.price,
    };
  });

  const subtotal = orderItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0,
  );

  const deliveryCharge =
    subtotal >= 1000 ? 0 : 60;

  const totalAmount =
    subtotal + deliveryCharge;

  // Group products by farmer
  const farmerGroups = new Map<
    string,
    IOrderProduct[]
  >();

  for (const item of orderItems) {
    const existing =
      farmerGroups.get(item.farmerId);

    const orderProduct: IOrderProduct = {
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    };

    if (existing) {
      existing.push(orderProduct);
    } else {
      farmerGroups.set(item.farmerId, [
        orderProduct,
      ]);
    }
  }

  const subOrders = Array.from(
    farmerGroups.entries(),
  ).map(([farmerId, items]) => ({
    farmerId,
    items,
    status: "pending" as const,
    riderId: null,
  }));

  const order: IOrder = {
    email,

    subOrders,

    shippingAddress,

    subtotal,
    deliveryCharge,
    totalAmount,

    paymentMethod,

    paymentStatus: "pending",

    orderStatus: "pending",

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result =
    await orderCollection.insertOne(order);

  return {
    ...order,
    _id: result.insertedId,
  };
};

const getAllOrders = async () => {
  return await orderCollection.find({}).sort({ createdAt: -1 }).toArray();
};

export const OrderService = {
  createOrder,
  getAllOrders
};
