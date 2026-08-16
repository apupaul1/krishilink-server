import { db } from "../../app/config/db";
import { ICart } from "./cart.interface";

export const cartCollection = db.collection<ICart>("carts");
