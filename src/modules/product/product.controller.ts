import { NextFunction, Request, Response } from "express";
import { ProductService } from "./product.service";

type ProductParams = {
  id: string;
};

const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await ProductService.createProduct(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const email = req.query.email as string;

    const result = await ProductService.getAllProducts(email);

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getFeaturedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await ProductService.getFeaturedProducts();

    res.status(200).json({
      success: true,
      message: "Featured products fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleProduct = async (
  req: Request<ProductParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const result = await ProductService.getSingleProduct(id);

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (
  req: Request<ProductParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const result = await ProductService.updateProduct(id, req.body);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (
  req: Request<ProductParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const result = await ProductService.deleteProduct(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const ProductController = {
  createProduct,
  getAllProducts,
  getFeaturedProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};
