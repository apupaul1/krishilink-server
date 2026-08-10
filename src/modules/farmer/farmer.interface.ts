export type TFarmerApplicationStatus = "pending" | "approved" | "rejected";

export interface ICreateFarmerApplication {
  userId: string;

  name: string;
  email: string;
  photoURL: string;

  phone: string;

  nid: string;

  district: string;
  area: string;
  address: string;

  experience: string;
}

export interface IFarmerApplication extends ICreateFarmerApplication {
  status: TFarmerApplicationStatus;

  createdAt: Date;
  updatedAt: Date;
}
