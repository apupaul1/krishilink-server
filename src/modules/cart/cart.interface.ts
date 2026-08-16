import { ObjectId } from "mongodb";

export interface ICartItem {
  productId: ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
  unit: "kg" | "piece" | "dozen" | "gram";
  stock: number;

  farmerEmail: string;
  baseDeliveryCharge: number;

  location: {
    district: string;
    area: string;
    address: string;
  };

  isSelected?: boolean;
}

export interface ICart {
  _id?: ObjectId;

  customerEmail: string;

  items: ICartItem[];

  createdAt: Date;
  updatedAt: Date;
}

export interface IAddToCart {
  productId: string;
  quantity: number;
}

export interface IBuyNow {
  productId: string;
  quantity: number;
}
