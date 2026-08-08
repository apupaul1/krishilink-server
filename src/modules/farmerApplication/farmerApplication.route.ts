import { Router } from "express";
import { FarmerController } from "./farmerApplication.controller";
import verifyFirebaseToken from "../../app/middlewares/verifyFirebaseToken";

const router = Router();

router.post("/", verifyFirebaseToken, FarmerController.createApplication);

router.get("/", verifyFirebaseToken, FarmerController.getAllApplications);

router.patch("/:id", FarmerController.updateApplication);

router.delete("/:id", FarmerController.deleteApplication);

export const FarmerApplicationRoutes = router;
