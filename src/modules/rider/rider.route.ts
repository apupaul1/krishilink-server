import { Router } from "express";
import { RiderController } from "./rider.controller";
import verifyFirebaseToken from "../../app/middlewares/verifyFirebaseToken";
import { verifyAdmin } from "../../app/middlewares/auth";

const router = Router();

router.post("/", verifyFirebaseToken, RiderController.createRider);

router.get("/",  RiderController.getAllRiders);

router.patch("/:id", verifyFirebaseToken, RiderController.updateRider);

router.delete("/:id", verifyFirebaseToken, RiderController.deleteRider);

export const RiderRoutes = router;
