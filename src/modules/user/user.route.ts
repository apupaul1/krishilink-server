import { Router } from "express";
import { UserController } from "./user.controller";

const router = Router();

router.post("/", UserController.createUser);

router.get("/", UserController.getUsers);

router.get("/:email", UserController.getSingleUser);

router.patch("/:id", UserController.updateUser);

router.delete("/:id", UserController.deleteUser);

router.get("/:email/role", UserController.getUserRole)

router.patch("/:email/role", UserController.updateUserRole)

export const UserRoutes = router;