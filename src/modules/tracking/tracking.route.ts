import express from "express";
import { TrackingController } from "./tracking.controller";

const router = express.Router();

router.get("/:trackingId", TrackingController.getTrackingLogs);

export const TrackingRoutes = router;
