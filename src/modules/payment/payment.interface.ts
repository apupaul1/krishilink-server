import { ObjectId } from "mongodb";
import { ICreateOrder } from "../order/order.interface";

export type TPaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export interface IPayment {
  _id?: ObjectId;

  transactionId: string;

  customerEmail: string;

  orderIds?: ObjectId[];

  orderPayload: ICreateOrder;

  amount: number;

  paymentMethod: "sslcommerz";

  status: TPaymentStatus;

  cartProductIds: ObjectId[];

  valId?: string;

  createdAt: Date;

  updatedAt: Date;
}

export interface ISSLCallback {
  status?: string;

  tran_id?: string;

  val_id?: string;

  amount?: string;

  currency?: string;

  [key: string]: unknown;
}
