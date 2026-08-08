import { Request, Response } from "express";
import { UserService } from "./user.service";
import { sendResponse } from "../../app/utils/sendResponse";

type UserParams = {
  id: string;
};

const createUser = async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User saved successfully.",
    data: result,
  });
};

const getUsers = async (req: Request, res: Response) => {
  const result = await UserService.getUsers();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully.",
    data: result,
  });
};

const getSingleUser = async (req: Request, res: Response) => {
  const result = await UserService.getSingleUser(req.params.email as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully.",
    data: result,
  });
};

const updateUser = async (req: Request<UserParams>, res: Response) => {
  const result = await UserService.updateUser(req.params.id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User updated successfully.",
    data: result,
  });
};

const deleteUser = async (req: Request<UserParams>, res: Response) => {
  const result = await UserService.deleteUser(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully.",
    data: result,
  });
};

const getUserRole = async (req: Request, res: Response) => {
  const result = await UserService.getUserRole(req.params.email as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User role retrieved successfully.",
    data: result,
  });
};

const updateUserRole = async (req: Request, res: Response) => {
  const { email } = req.params;
  const { role } = req.body;

  const result = await UserService.updateUserRole(email as string, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User role updated successfully.",
    data: result,
  });
};

export const UserController = {
  createUser,
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  getUserRole,
  updateUserRole
};
