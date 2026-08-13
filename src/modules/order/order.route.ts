import { Router } from "express";
import verifyFirebaseToken from "../../app/middlewares/verifyFirebaseToken";
import { OrderController } from "./order.controller";

const router = Router();

router.post("/", verifyFirebaseToken, OrderController.createOrder);

router.get("/", OrderController.getAllOrders);

router.patch("/:orderId/status", OrderController.updateOrderStatus);

export const OrderRoutes = router;
