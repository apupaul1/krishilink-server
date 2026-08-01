import { Router } from "express";
import { ProductController } from "./product.controller";

const router = Router();

router.post("/", ProductController.createProduct);
router.get("/", ProductController.getAllProducts);
router.get("/featured", ProductController.getFeaturedProducts);
router.get("/:id", ProductController.getSingleProduct);
router.patch("/:id", ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);

export const ProductRoutes = router;