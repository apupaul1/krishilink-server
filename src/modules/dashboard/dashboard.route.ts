import { Router } from "express";
import verifyFirebaseToken from "../../app/middlewares/verifyFirebaseToken";
import {
  verifyAdmin,
  verifyFarmer,
  verifyRider,
} from "../../app/middlewares/auth";
import { DashboardController } from "./dashboard.controller";

const router = Router();

// Every dashboard endpoint requires a valid Firebase ID token.
router.use(verifyFirebaseToken);

// Role-aware overview: returns the payload for the caller's own role.
router.get("/", DashboardController.getDashboardOverview);

// Role-specific dashboards.
router.get("/admin", verifyAdmin, DashboardController.getAdminDashboard);

router.get("/farmer", verifyFarmer, DashboardController.getFarmerDashboard);

router.get("/rider", verifyRider, DashboardController.getRiderDashboard);

router.get("/user", DashboardController.getUserDashboard);

export const DashboardRoutes = router;
