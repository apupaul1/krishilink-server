import { Router } from "express";
import verifyFirebaseToken from "../../app/middlewares/verifyFirebaseToken";
import { OrderController } from "./order.controller";

const router = Router();

router.post("/", verifyFirebaseToken, OrderController.createOrder);

router.get("/", OrderController.getAllOrders);

router.patch("/:orderId/status", OrderController.updateOrderStatus);

router.patch("/:orderId/assign-rider", OrderController.assignRider);

router.patch("/:orderId/reject-rider", OrderController.rejectRider);

export const OrderRoutes = router;
