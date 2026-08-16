import { Request, Response } from "express";
import { CartService } from "./cart.service";

const addToCart = async (req: Request, res: Response) => {
  const email = req.user.email;

  if (!email) {
    return res.status(401).json({
      success: false,
      message: "User email not found.",
    });
  }

  const result = await CartService.addToCart(email, req.body);

  res.status(200).json({
    success: true,
    message: "Product added to cart successfully.",
    data: result,
  });
};

const getCart = async (req: Request, res: Response) => {
  const { email } = req.query;

  if (!email || typeof email !== "string") {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const result = await CartService.getCart(email);

  res.status(200).json({
    success: true,
    message: "Cart retrieved successfully.",
    data: result,
  });
};

const updateQuantity = async (req: Request, res: Response) => {
  const { email } = req.body;
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  if (!productId || Array.isArray(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID.",
    });
  }

  const result = await CartService.updateQuantity(
    email,
    productId,
    Number(quantity),
  );

  res.status(200).json({
    success: true,
    message: "Cart quantity updated successfully.",
    data: result,
  });
};

const toggleSelection = async (req: Request, res: Response) => {
  const { email } = req.body;

  const productId = req.params.productId;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  if (!productId || Array.isArray(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID.",
    });
  }

  const result = await CartService.toggleSelection(email, productId);

  res.status(200).json({
    success: true,
    message: "Cart item selection updated successfully.",
    data: result,
  });
};

const toggleSelectAll = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const result = await CartService.toggleSelectAll(email);

  res.status(200).json({
    success: true,
    message: "Cart selection updated successfully.",
    data: result,
  });
};

const removeFromCart = async (req: Request, res: Response) => {
  const { email } = req.body;
  const productId = req.params.productId;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  if (!productId || Array.isArray(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID.",
    });
  }

  const result = await CartService.removeFromCart(email, productId);

  res.status(200).json({
    success: true,
    message: "Product removed from cart successfully.",
    data: result,
  });
};

const clearCart = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const result = await CartService.clearCart(email);

  res.status(200).json({
    success: true,
    message: "Cart cleared successfully.",
    data: result,
  });
};

const buyNow = async (req: Request, res: Response) => {
  const { email } = req.query;

  const { productId, quantity } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const result = await CartService.buyNow(email, {
    productId,
    quantity: Number(quantity),
  });

  res.status(200).json({
    success: true,
    message: "Product prepared for checkout.",
    data: result,
  });
};

const removeCartItems = async (req: Request, res: Response) => {
  const { email } = req.query;

  const { productIds } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Product IDs are required.",
    });
  }

  const result = await CartService.removeCartItems(email, productIds);

  res.status(200).json({
    success: true,
    message: "Purchased cart items removed successfully.",
    data: result,
  });
};

export const CartController = {
  addToCart,
  getCart,
  updateQuantity,
  toggleSelection,
  toggleSelectAll,
  removeFromCart,
  clearCart,
  buyNow,
  removeCartItems
};
