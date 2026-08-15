import express from "express";

import { PaymentController } from "./payment.controller";

const router = express.Router();

router.get("/", PaymentController.getAllPayments);

router.post("/success", PaymentController.paymentSuccess);

router.post("/fail", PaymentController.paymentFail);

router.post("/cancel", PaymentController.paymentCancel);

router.post("/ipn", PaymentController.paymentIPN);

export const PaymentRoutes = router;
