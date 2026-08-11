import { ObjectId } from "mongodb";

export type TPaymentMethod = "cod" | "sslcommerz";

export type TPaymentStatus =
  | "pending"
  | "paid"
  | "failed";

export type TOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready_for_pickup"
  | "assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type TSubOrderStatus =
  | "pending"
  | "preparing"
  | "ready_for_pickup"
  | "picked_up";

export interface IOrderProduct {
  productId: ObjectId;
  quantity: number;
  price: number;
}

export interface ISubOrder {
  farmerId: string;

  items: IOrderProduct[];

  status: TSubOrderStatus;

  riderId: string | null;
}

export interface IShippingAddress {
  name: string;
  phone: string;
  district: string;
  area: string;
  address: string;
  note?: string;
}

export interface ICreateOrder {
  products: {
    productId: string;
    quantity: number;
  }[];

  shippingAddress: IShippingAddress;

  paymentMethod: TPaymentMethod;
}

export interface IOrder {
  _id?: ObjectId;

  email: string;

  subOrders: ISubOrder[];

  shippingAddress: IShippingAddress;

  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;

  paymentMethod: TPaymentMethod;

  paymentStatus: TPaymentStatus;

  orderStatus: TOrderStatus;

  createdAt: Date;
  updatedAt: Date;
}