import { NextFunction, Request, Response } from "express";
import { UserService } from "../../modules/user/user.service";

const requireUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const email = req.user?.email;

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const role = await UserService.getUserRole(email);

    if (role !== "user") {
      return res.status(403).json({
        success: false,
        message: "For ordering, please login with your user account.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default requireUserRole;
