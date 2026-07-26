export interface IProduct {
  name: string;
  category: string;

  description: string;

  price: number;
  unit: "kg" | "piece" | "dozen" | "gram";

  stock: number;

  images: string[];

  farmer: {
    uid: string;
    email: string;
    name: string;
  };

  isAvailable: boolean;

  createdAt: Date;
  updatedAt: Date;
}