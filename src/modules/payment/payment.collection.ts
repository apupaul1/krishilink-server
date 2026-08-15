import { db } from "../../app/config/db";
import { IPayment } from "./payment.interface";

export const paymentCollection = db.collection<IPayment>("payments");
