import { Request, Response } from "express";
import { OrderService } from "./order.service";
import { sendResponse } from "../../app/utils/sendResponse";

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
  const result = await OrderService.getAllOrders();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Orders retrieved successfully.",
    data: result,
  });
};

export const OrderController = {
  createOrder,
  getAllOrders,
};
