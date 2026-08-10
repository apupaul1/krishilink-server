import { Router } from "express";
import { CategoryRoutes } from "../../modules/category/category.route";
import { ProductRoutes } from "../../modules/product/product.route";
import { UserRoutes } from "../../modules/user/user.route";
import { FarmerRoutes } from "../../modules/farmer/farmer.route";
import { RiderRoutes } from "../../modules/rider/rider.route";

const router = Router();

router.use("/categories", CategoryRoutes);
router.use("/products", ProductRoutes);
router.use("/users", UserRoutes);
router.use("/farmer-applications", FarmerRoutes);
router.use("/riders", RiderRoutes);

export default router;
