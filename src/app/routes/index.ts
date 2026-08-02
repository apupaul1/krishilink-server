import { Router } from "express";
import { CategoryRoutes } from "../../modules/category/category.route";
import { ProductRoutes } from "../../modules/product/product.route";
import { UserRoutes } from "../../modules/user/user.route";

const router = Router();

router.use("/categories", CategoryRoutes);
router.use("/products", ProductRoutes);
router.use("/users", UserRoutes)

export default router;
