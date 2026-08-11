import { Router } from "express";
import verifyFirebaseToken from "../../app/middlewares/verifyFirebaseToken";
import { OrderController } from "./order.controller";

const router = Router();

router.post("/", verifyFirebaseToken, OrderController.createOrder);

router.get("/", OrderController.getAllOrders);

export const OrderRoutes = router;
