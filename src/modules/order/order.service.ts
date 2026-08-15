import { ObjectId } from "mongodb";

import { db } from "../../app/config/db";

import {
  ICreateOrder,
  IGetOrdersQuery,
  IOrder,
  IOrderProduct,
  IPreparedOrder,
} from "./order.interface";


import { allowedStatusTransitions } from "./order.utils";
import { riderCollection } from "../rider/rider.service";
import { TrackingService } from "../tracking/tracking.service";
import { PaymentService } from "../payment/payment.service";
import { insertOrders, prepareOrders } from "./order.helper";
import { orderCollection } from "./order.collection";

const createOrder = async (email: string, payload: ICreateOrder) => {
  const prepared = await prepareOrders(email, payload);

  // =============================
  // COD
  // =============================

  if (payload.paymentMethod === "cod") {
    const orders = await insertOrders(prepared.orders);

    return {
      orders,
    };
  }

  // =============================
  // SSLCommerz
  // =============================

  const payment = await PaymentService.initiateSSLCommerzPayment({
    email,
    payload,
    amount: prepared.totalAmount,
  });

  return {
    payment,
  };
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
