import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { sendResponse } from "../../app/utils/sendResponse";
import { TOrderStatus } from "./order.interface";

const createOrder = async (req: Request, res: Response) => {
  const email = req.user.email;

  if (!email) {
    return res.status(401).json({
      success: false,
      message: "User email not found.",
    });
  }

  const result = await OrderService.createOrder(email, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Order created successfully.",
    data: result,
  });
};

const getAllOrders = async (req: Request, res: Response) => {
  const { email, farmerEmail, riderEmail, status } = req.query;

  const result = await OrderService.getAllOrders({
    email: email as string | undefined,
    farmerEmail: farmerEmail as string | undefined,
    riderEmail: riderEmail as string | undefined,
    status: status as TOrderStatus | undefined,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Orders retrieved successfully.",
    data: result,
  });
};

const updateOrderStatus = async (req: Request, res: Response) => {
  const orderId = req.params.orderId as string;
  const { status } = req.body;

  const result = await OrderService.updateOrderStatus(orderId, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order status updated successfully.",
    data: result,
  });
};

const assignRider = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { riderEmail } = req.body;

  if (typeof orderId !== "string") {
    throw new Error("Invalid order ID.");
  }

  if (!riderEmail) {
    throw new Error("Rider ID is required.");
  }

  const result = await OrderService.assignRider(orderId, riderEmail);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rider assigned successfully.",
    data: result,
  });
};

const rejectRider = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (typeof orderId !== "string") {
    throw new Error("Invalid order ID.");
  }

  const result = await OrderService.rejectRider(orderId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rider rejected the order successfully.",
    data: result,
  });
};

export const OrderController = {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  assignRider,
  rejectRider,
};
