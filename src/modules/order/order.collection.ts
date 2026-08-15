import { db } from "../../app/config/db";
import { IOrder } from "./order.interface";

export const orderCollection = db.collection<IOrder>("orders");
