import { Router } from "express";
import { CategoryRoutes } from "../../modules/category/category.route";
import { ProductRoutes } from "../../modules/product/product.route";

const router = Router();

router.use("/categories", CategoryRoutes);
router.use("/products", ProductRoutes);

export default router;
