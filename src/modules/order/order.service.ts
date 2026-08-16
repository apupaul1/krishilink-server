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
import { ProductService } from "../product/product.service";

const createOrder = async (email: string, payload: ICreateOrder) => {
  const prepared = await prepareOrders(email, payload);

  // =============================
  // COD
  // =============================

  if (payload.paymentMethod === "cod") {
    const orders = await insertOrders(prepared.orders);

    await decreaseStockForOrders(orders);

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

  // COD payment becomes paid after delivery
  if (status === "delivered" && order.paymentMethod === "cod") {
    updateData.paymentStatus = "paid";
  }

  const result = await orderCollection.updateOne(
    {
      _id: new ObjectId(orderId),
      orderStatus: order.orderStatus,
    },
    {
      $set: updateData,
    },
  );

  if (result.modifiedCount === 0) {
    throw new Error("Order status was not updated.");
  }

  if (status === "cancelled") {
    await ProductService.increaseStock(
      order.items.map((item) => ({
        productId: new ObjectId(item.productId),
        quantity: item.quantity,
      })),
    );
  }

  await TrackingService.logTracking(order.trackingId, status);

  // --------------------------------
  // Rider becomes available
  // --------------------------------

  if ((status === "delivered" || status === "cancelled") && order.riderEmail) {
    await riderCollection.updateOne(
      {
        email: order.riderEmail,
        workStatus: "busy",
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

  // --------------------------------
  // 1. Check order
  // --------------------------------

  const order = await orderCollection.findOne({
    _id: new ObjectId(orderId),
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.orderStatus !== "ready_for_pickup") {
    throw new Error("Only ready for pickup orders can be assigned to a rider.");
  }

  // --------------------------------
  // 2. Atomically make rider busy
  // --------------------------------

  const riderResult = await riderCollection.updateOne(
    {
      email: riderEmail,
      status: "approved",
      workStatus: "available",
    },
    {
      $set: {
        workStatus: "busy",
        updatedAt: new Date(),
      },
    },
  );

  if (riderResult.modifiedCount === 0) {
    throw new Error("Rider is not available.");
  }

  // --------------------------------
  // 3. Assign rider to order
  // --------------------------------

  const orderResult = await orderCollection.updateOne(
    {
      _id: new ObjectId(orderId),
      orderStatus: "ready_for_pickup",
      riderEmail: null,
    },
    {
      $set: {
        riderEmail,
        orderStatus: "waiting_for_rider_acceptance",
        updatedAt: new Date(),
      },
    },
  );

  // --------------------------------
  // 4. Rollback rider if order failed
  // --------------------------------

  if (orderResult.modifiedCount === 0) {
    await riderCollection.updateOne(
      {
        email: riderEmail,
      },
      {
        $set: {
          workStatus: "available",
          updatedAt: new Date(),
        },
      },
    );

    throw new Error("Failed to assign rider.");
  }

  // --------------------------------
  // 5. Tracking
  // --------------------------------

  await TrackingService.logTracking(
    order.trackingId,
    "waiting_for_rider_acceptance",
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

  const riderEmail = order.riderEmail;

  // -----------------------------
  // 1. Release rider
  // -----------------------------

  const riderResult = await riderCollection.updateOne(
    {
      email: riderEmail,
      workStatus: "busy",
    },
    {
      $set: {
        workStatus: "available",
        updatedAt: new Date(),
      },
    },
  );

  if (riderResult.modifiedCount === 0) {
    throw new Error("Failed to release rider.");
  }

  // -----------------------------
  // 2. Reset order
  // -----------------------------

  const orderResult = await orderCollection.updateOne(
    {
      _id: new ObjectId(orderId),
      orderStatus: "waiting_for_rider_acceptance",
      riderEmail,
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
    // rollback rider
    await riderCollection.updateOne(
      {
        email: riderEmail,
      },
      {
        $set: {
          workStatus: "busy",
          updatedAt: new Date(),
        },
      },
    );

    throw new Error("Failed to reject rider.");
  }

  await TrackingService.logTracking(order.trackingId, "ready_for_pickup");

  return orderResult;
};

const decreaseStockForOrders = async (orders: IOrder[]) => {
  const stockItems = orders.flatMap((order) =>
    order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  );

  await ProductService.decreaseStock(stockItems);
};

export const OrderService = {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  assignRider,
  rejectRider,
  decreaseStockForOrders,
};
