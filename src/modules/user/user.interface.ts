export interface ICreateUser {
  name: string;
  email: string;
  photoURL: string;
}

export type TRole = "user" | "farmer" | "admin" | "rider";

export interface IUser extends ICreateUser {
  role: TRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpdateUser {
  name?: string;
  photoURL?: string;
}
