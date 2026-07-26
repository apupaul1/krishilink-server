import { Response } from "express";

interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
}

export const sendResponse = <T>(
  res: Response,
  payload: IResponse<T>
) => {
  const { statusCode, ...rest } = payload;

  res.status(statusCode).json(rest);
};