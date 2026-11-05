import express from "express";
import cors from "cors";
import { notFound } from "./app/middlewares/notFound.js";
import { handleError } from "./app/errors/handleError.js";
import { CategoryRoutes } from "./modules/category/category.route.js";
import { ProductRoutes } from "./modules/product/product.route.js";
import { UserRoutes } from "./modules/user/user.route.js";
import { FarmerRoutes } from "./modules/farmer/farmer.route.js";
import { RiderRoutes } from "./modules/rider/rider.route.js";
import { OrderRoutes } from "./modules/order/order.route.js";
import { TrackingRoutes } from "./modules/tracking/tracking.route.js";
import { PaymentRoutes } from "./modules/payment/payment.route.js";
import { CartRoutes } from "./modules/cart/cart.route.js";
import { DashboardRoutes } from "./modules/dashboard/dashboard.route.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.get("/", (req, res) => {
  res.send("KrishiLink Server Running");
});

app.use("/api/v1/categories", CategoryRoutes);
app.use("/api/v1/products", ProductRoutes);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/farmers", FarmerRoutes);
app.use("/api/v1/riders", RiderRoutes);
app.use("/api/v1/orders", OrderRoutes);
app.use("/api/v1/trackings", TrackingRoutes);
app.use("/api/v1/payments", PaymentRoutes);
app.use("/api/v1/carts", CartRoutes);
app.use("/api/v1/dashboard", DashboardRoutes);

app.use(notFound);
app.use(handleError);

export default app;
