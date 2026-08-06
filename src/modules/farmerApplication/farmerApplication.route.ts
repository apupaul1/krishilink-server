import { Router } from "express";
import { FarmerController } from "./farmerApplication.controller";

const router = Router();

router.post("/", FarmerController.createApplication);

router.get("/", FarmerController.getAllApplications);

router.patch("/:id", FarmerController.updateApplication);

router.delete("/:id", FarmerController.deleteApplication);

export const FarmerApplicationRoutes = router;
