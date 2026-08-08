import "../config/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { NextFunction, Request, Response } from "express";

const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {

    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const idToken = token.split(" ")[1];

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    const decoded = await getAuth().verifyIdToken(idToken);

    req.user = decoded;

    next();

  } catch (error) {
    console.log(error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized access.",
    });
  }
};

export default verifyFirebaseToken;
