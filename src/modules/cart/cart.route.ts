import express from "express";
import { CartController } from "./cart.controller";
import verifyFirebaseToken from "../../app/middlewares/verifyFirebaseToken";

const router = express.Router();

router.get("/", CartController.getCart);
router.post("/items", verifyFirebaseToken, CartController.addToCart);
router.patch("/items/:productId", CartController.updateQuantity);
router.patch("/items/:productId/selection", CartController.toggleSelection);
router.patch("/selection", CartController.toggleSelectAll);
router.delete("/items/:productId", CartController.removeFromCart);
router.delete("/", CartController.clearCart);
router.post("/buy-now", CartController.buyNow);
router.delete("/items", CartController.removeCartItems);

export const CartRoutes = router;
