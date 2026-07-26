import { Router } from "express";
import { CategoryController } from "./category.controller";

const router = Router();

router.post("/", CategoryController.createCategory);

router.get("/", CategoryController.getAllCategories);

export const CategoryRoutes = router;