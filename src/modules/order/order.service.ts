import { ObjectId } from "mongodb";
import crypto from "crypto";

import { db } from "../../app/config/db";

import {
  ICreateOrder,
  IGetOrdersQuery,
  IOrder,
  IOrderProduct,
} from "./order.interface";

import { productCollection } from "../product/product.service";

import {
  allowedStatusTransitions,
  calculateDeliveryCharge,
} from "./order.utils";
import { riderCollection } from "../rider/rider.service";
import { TrackingService } from "../tracking/tracking.service";

export const orderCollection = db.collection<IOrder>("orders");

function generateTrackingId() {
  const prefix = "KL";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `${prefix}-${date}-${random}`;
}

const createOrder = async (email: string, payload: ICreateOrder) => {
  const { products, shippingAddress, paymentMethod } = payload;

  if (!products || products.length === 0) {
    throw new Error("No products found.");
  }

  // ------------------------------------
  // 1. Validate product IDs
  // ------------------------------------

  const productIds = products.map((item) => {
    if (!ObjectId.isValid(item.productId)) {
      throw new Error(`Invalid product ID: ${item.productId}`);
    }

    return new ObjectId(item.productId);
  });

  // ------------------------------------
  // 2. Get products from database
  // ------------------------------------

  const dbProducts = await productCollection
    .find({
      _id: {
        $in: productIds,
      },
    })
    .toArray();

  if (dbProducts.length !== products.length) {
    throw new Error("One or more products were not found.");
  }

  // ------------------------------------
  // 3. Prepare order items
  // ------------------------------------

  const orderItems = products.map((item) => {
    const product = dbProducts.find(
      (product) => product._id.toString() === item.productId,
    );

    if (!product) {
      throw new Error("Product not found.");
    }

    if (item.quantity <= 0) {
      throw new Error("Invalid product quantity.");
    }

    if (item.quantity > product.stock) {
      throw new Error(`Insufficient stock for ${product.name}.`);
    }

    const orderProduct: IOrderProduct = {
      productId: product._id,
      name: product.name,
      image: product.images[0],
      quantity: item.quantity,
      unit: product.unit,
      price: product.price,
    };

    return {
      ...orderProduct,

      farmerEmail: product.farmer.email,

      farmerLocation: product.location,

      baseDeliveryCharge: product.baseDeliveryCharge ?? 50,
    };
  });

  // ------------------------------------
  // 4. Group products by farmer
  // ------------------------------------

  const farmerGroups = new Map<string, typeof orderItems>();

  for (const item of orderItems) {
    const farmerEmail = item.farmerEmail;

    const existing = farmerGroups.get(farmerEmail);

    if (existing) {
      existing.push(item);
    } else {
      farmerGroups.set(farmerEmail, [item]);
    }
  }

  // ------------------------------------
  // 5. Create separate orders
  // ------------------------------------

  const orders: IOrder[] = [];

  for (const [farmerEmail, items] of farmerGroups.entries()) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const firstItem = items[0];

    const deliveryCharge = calculateDeliveryCharge(
      firstItem.farmerLocation,
      {
        district: shippingAddress.district,
        area: shippingAddress.area,
      },
      firstItem.baseDeliveryCharge,
    );

    const totalAmount = subtotal + deliveryCharge;

    const trackingId = generateTrackingId();

    const order: IOrder = {
      trackingId,

      customerEmail: email,

      farmerEmail,

      farmerLocation: {
        district: firstItem.farmerLocation.district,
        area: firstItem.farmerLocation.area,
        address: firstItem.farmerLocation.address,
      },

      items: items.map(
        ({
          farmerEmail: _farmerEmail,
          farmerLocation: _farmerLocation,
          baseDeliveryCharge: _baseDeliveryCharge,
          ...orderItem
        }) => orderItem,
      ),

      shippingAddress,

      subtotal,

      deliveryCharge,

      totalAmount,

      paymentMethod,

      paymentStatus: "pending",

      orderStatus: "pending",

      riderEmail: null,

      createdAt: new Date(),

      updatedAt: new Date(),
    };

    orders.push(order);
  }

  // ------------------------------------
  // 6. Insert all orders
  // ------------------------------------

  const result = await orderCollection.insertMany(orders);

  for (const order of orders) {
    await TrackingService.logTracking(order.trackingId, order.orderStatus);
  }

  const insertedOrders = orders.map((order, index) => ({
    ...order,
    _id: result.insertedIds[index],
  }));

  return insertedOrders;
};

const getAllOrders = async ({
  email,
  farmerEmail,
  riderEmail,
  status,
}: IGetOrdersQuery) => {
  const query: Record<string, unknown> = {};

  if (email) {
    query.customerEmail = email;
  }

  if (farmerEmail) {
    query.farmerEmail = farmerEmail;
  }

  if (riderEmail) {
    query.riderEmail = riderEmail;
  }

  if (status) {
    query.orderStatus = status;
  }

  const orders = await orderCollection
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return orders;
};

const updateOrderStatus = async (
  orderId: string,
  status: IOrder["orderStatus"],
) => {
  if (!ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID.");
  }

  const order = await orderCollection.findOne({
    _id: new ObjectId(orderId),
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  const allowedNextStatuses = allowedStatusTransitions[order.orderStatus];

  if (!allowedNextStatuses.includes(status)) {
    throw new Error(
      `Cannot change status from ${order.orderStatus} to ${status}.`,
    );
  }

  const updateData: Record<string, unknown> = {
    orderStatus: status,
    updatedAt: new Date(),
  };

  if (status === "delivered" && order.paymentMethod === "cod") {
    updateData.paymentStatus = "paid";
  }

  const result = await orderCollection.updateOne(
    {
      _id: new ObjectId(orderId),
    },
    {
      $set: updateData,
    },
  );

  if (result.modifiedCount === 0) {
    throw new Error("Order status was not updated.");
  }

  await TrackingService.logTracking(order.trackingId, status);

  // Delivery complete → rider available again
  if (status === "delivered" && order.riderEmail) {
    await riderCollection.updateOne(
      {
        email: order.riderEmail,
      },
      {
        $set: {
          workStatus: "available",
          updatedAt: new Date(),
        },
      },
    );
  }

  return result;
};

const assignRider = async (orderId: string, riderEmail: string) => {
  if (!ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID.");
  }

  const order = await orderCollection.findOne({
    _id: new ObjectId(orderId),
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.orderStatus !== "ready_for_pickup") {
    throw new Error("Only ready for pickup orders can be assigned to a rider.");
  }

  const rider = await riderCollection.findOne({
    email: riderEmail,
    status: "approved",
    workStatus: "available",
  });

  if (!rider) {
    throw new Error("Rider is not available.");
  }

  const orderResult = await orderCollection.updateOne(
    {
      _id: new ObjectId(orderId),
      orderStatus: "ready_for_pickup",
    },
    {
      $set: {
        riderEmail: rider.email,
        orderStatus: "waiting_for_rider_acceptance",
        updatedAt: new Date(),
      },
    },
  );

  if (orderResult.modifiedCount === 0) {
    throw new Error("Failed to assign rider.");
  }

  await TrackingService.logTracking(
    order.trackingId,
    "waiting_for_rider_acceptance",
  );

  await riderCollection.updateOne(
    {
      _id: rider._id,
      workStatus: "available",
    },
    {
      $set: {
        workStatus: "busy",
        updatedAt: new Date(),
      },
    },
  );

  return orderResult;
};

const rejectRider = async (orderId: string) => {
  if (!ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID.");
  }

  const order = await orderCollection.findOne({
    _id: new ObjectId(orderId),
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.orderStatus !== "waiting_for_rider_acceptance") {
    throw new Error("This order is not waiting for rider acceptance.");
  }

  if (!order.riderEmail) {
    throw new Error("No rider is assigned to this order.");
  }

  const rider = await riderCollection.findOne({
    email: order.riderEmail,
  });

  if (!rider) {
    throw new Error("Assigned rider not found.");
  }

  const orderResult = await orderCollection.updateOne(
    {
      _id: new ObjectId(orderId),
      orderStatus: "waiting_for_rider_acceptance",
    },
    {
      $set: {
        orderStatus: "ready_for_pickup",
        riderEmail: null,
        updatedAt: new Date(),
      },
    },
  );

  if (orderResult.modifiedCount === 0) {
    throw new Error("Failed to reject rider.");
  }

  await TrackingService.logTracking(order.trackingId, "ready_for_pickup");

  await riderCollection.updateOne(
    {
      _id: rider._id,
      workStatus: "busy",
    },
    {
      $set: {
        workStatus: "available",
        updatedAt: new Date(),
      },
    },
  );

  return orderResult;
};

export const OrderService = {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  assignRider,
  rejectRider,
};
