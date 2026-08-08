import { Router } from "express";
import { CategoryRoutes } from "../../modules/category/category.route";
import { ProductRoutes } from "../../modules/product/product.route";
import { UserRoutes } from "../../modules/user/user.route";
import { FarmerApplicationRoutes } from "../../modules/farmerApplication/farmerApplication.route";

const router = Router();

router.use("/categories", CategoryRoutes);
router.use("/products", ProductRoutes);
router.use("/users", UserRoutes);
router.use("/farmer-applications", FarmerApplicationRoutes);

export default router;
