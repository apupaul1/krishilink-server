import { Request, Response } from "express";

import { PaymentService } from "./payment.service";
import { sendResponse } from "../../app/utils/sendResponse";


const paymentSuccess = async (req: Request, res: Response) => {
  try {
    const result = await PaymentService.completeSSLCommerzPayment(req.body);

    res.redirect(
      `${process.env.FRONTEND_URL}/payment/success?transactionId=${result.transactionId}`,
    );
  } catch (error) {
    console.error("Payment success handling error:", error);

    res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
  }
};

const paymentFail = async (req: Request, res: Response) => {
  try {
    const tranId = req.body.tran_id;

    if (tranId) {
      await PaymentService.markPaymentAsFailed(tranId);
    }

    res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
  } catch (error) {
    console.error("Payment fail handling error:", error);

    res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
  }
};

const paymentCancel = async (req: Request, res: Response) => {
  try {
    const tranId = req.body.tran_id;

    if (tranId) {
      await PaymentService.markPaymentAsCancelled(tranId);
    }

    res.redirect(`${process.env.FRONTEND_URL}/payment/cancel`);
  } catch (error) {
    console.error("Payment cancel handling error:", error);

    res.redirect(`${process.env.FRONTEND_URL}/payment/cancel`);
  }
};

const paymentIPN = async (req: Request, res: Response) => {
  try {
    await PaymentService.completeSSLCommerzPayment(req.body);

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("IPN processing error:", error);

    res.status(400).json({
      success: false,
    });
  }
};

const getAllPayments = async (req: Request, res: Response) => {
  const { email } = req.query;

  // if (!email) {
  //   return res.status(400).json({
  //     success: false,
  //     message: "Customer email is required.",
  //   });
  // }

  const result = await PaymentService.getAllPayments({email: email as string | undefined});

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payments retrieved successfully.",
    data: result,
  });
};

export const PaymentController = {
  paymentSuccess,
  paymentIPN,
  paymentCancel,
  paymentFail,
  getAllPayments,
};
