import { ObjectId } from "mongodb";

export interface IProduct {
  _id?: ObjectId;

  name: string;
  category: string;
  description: string;

  price: number;
  unit: "kg" | "piece" | "dozen" | "gram";
  stock: number;

  images: string[];

  location: {
    district: string;
    area: string;
    address: string;
  };

  farmer: {
    uid: string;
    email: string;
    name: string;
  };

  baseDeliveryCharge: number;

  isAvailable: boolean;

  createdAt: Date;
  updatedAt: Date;
}
