import { NextFunction, Request, Response } from "express";
import { userCollection } from "../../modules/user/user.service";

const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = await userCollection.findOne({
    email: req.user.email,
  });

  if (!user || user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden access.",
    });
  }

  next();
};

const verifyFarmer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = await userCollection.findOne({
    email: req.user.email,
  });

  if (!user || user.role !== "farmer") {
    return res.status(403).json({
      success: false,
      message: "Forbidden access.",
    });
  }

  next();
};

const verifyRider = async (req: Request, res: Response, next: NextFunction) => {
  const user = await userCollection.findOne({
    email: req.user.email,
  });

  if (!user || user.role !== "rider") {
    return res.status(403).json({
      success: false,
      message: "Forbidden access.",
    });
  }

  next();
};

export { verifyAdmin, verifyFarmer, verifyRider };
