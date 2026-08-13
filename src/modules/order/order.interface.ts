import { ObjectId } from "mongodb";

export type TPaymentMethod = "cod" | "sslcommerz";

export type TPaymentStatus = "pending" | "paid" | "failed";

export type TOrderStatus =
  | "pending"
  | "preparing"
  | "ready_for_pickup"
  | "assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface IOrderProduct {
  productId: ObjectId;
  name: string;
  image: string;
  quantity: number;
  unit: "kg" | "piece" | "dozen" | "gram";
  price: number;
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

  trackingId: string;

  customerEmail: string;
  farmerEmail: string;

  farmerLocation: {
    district: string;
    area: string;
    address: string;
  };

  items: IOrderProduct[];

  shippingAddress: IShippingAddress;

  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;

  paymentMethod: TPaymentMethod;
  paymentStatus: TPaymentStatus;

  orderStatus: TOrderStatus;

  riderId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface IGetOrdersQuery {
  email?: string;
  farmerEmail?: string;
  riderId?: string;
  status?: TOrderStatus;
}
