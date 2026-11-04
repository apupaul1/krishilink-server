export interface IAdminDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeFarmers: number;
  activeRiders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingFarmerApplications: number;
  pendingRiderApplications: number;
}

export interface IRevenueOverview {
  month: string;
  revenue: number;
}

export interface IOrderOverview {
  status: string;
  count: number;
}

export interface ITopProduct {
  name: string;
  quantity: number;
}

export interface IRecentOrder {
  _id: string;
  trackingId: string;
  customerEmail: string;
  farmerEmail: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: Date;
}

export interface IAdminDashboard {
  stats: IAdminDashboardStats;

  revenueOverview: IRevenueOverview[];

  orderOverview: IOrderOverview[];

  topProducts: ITopProduct[];

  recentOrders: IRecentOrder[];
}

export interface IAdminDashboardResponse {
  success: boolean;
  message: string;
  data: IAdminDashboard;
}

export interface IFarmerDashboardStats {
  totalSales: number;
  totalOrders: number;
  activeProducts: number;
  pendingOrders: number;
}

export interface IFarmerSalesOverview {
  month: string;
  sales: number;
}

export interface IFarmerOrderOverview {
  status: string;
  count: number;
}

export interface IFarmerTopProduct {
  name: string;
  quantity: number;
}

export interface IFarmerRecentOrder {
  _id: string;
  trackingId: string;
  customerEmail: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: Date;
}

export interface IFarmerPendingOrder {
  _id: string;
  trackingId: string;
  customerEmail: string;
  totalAmount: number;
  createdAt: Date;
}

export interface IFarmerInventoryAlert {
  _id: string;
  name: string;
  image?: string;
  stock: number;
  unit: string;
  price: number;
}

export interface IFarmerDashboard {
  stats: IFarmerDashboardStats;

  salesOverview: IFarmerSalesOverview[];

  orderOverview: IFarmerOrderOverview[];

  topProducts: IFarmerTopProduct[];

  recentOrders: IFarmerRecentOrder[];

  pendingOrders: IFarmerPendingOrder[];

  inventoryAlerts: IFarmerInventoryAlert[];
}

export interface IFarmerDashboardResponse {
  success: boolean;
  message: string;
  data: IFarmerDashboard;
}

export interface IRiderDashboardStats {
  activeDelivery: number;
  pendingAcceptance: number;
  completedDeliveries: number;
  totalEarnings: number;
}

export interface IRiderCurrentDelivery {
  _id: string;
  trackingId: string;

  customerEmail: string;

  customerName: string;
  customerPhone: string;

  pickupLocation: {
    district: string;
    area: string;
    address: string;
  };

  deliveryLocation: {
    district: string;
    area: string;
    address: string;
  };

  totalAmount: number;
  deliveryCharge: number;

  orderStatus: string;
  createdAt: Date;
}

export interface IRiderDeliveryQueue {
  _id: string;
  trackingId: string;

  customerName: string;
  customerPhone: string;

  pickupLocation: {
    district: string;
    area: string;
    address: string;
  };

  deliveryLocation: {
    district: string;
    area: string;
    address: string;
  };

  deliveryCharge: number;

  orderStatus: string;
  createdAt: Date;
}

export interface IRiderRecentDelivery {
  _id: string;
  trackingId: string;

  customerName: string;

  deliveryLocation: {
    district: string;
    area: string;
  };

  deliveryCharge: number;

  orderStatus: string;
  createdAt: Date;
}

export interface IRiderDashboard {
  stats: IRiderDashboardStats;

  currentDelivery: IRiderCurrentDelivery | null;

  deliveryQueue: IRiderDeliveryQueue[];

  recentDeliveries: IRiderRecentDelivery[];
}

export interface IRiderDashboardResponse {
  success: boolean;
  message: string;
  data: IRiderDashboard;
}

export interface ICustomerDashboardStats {
  totalSpent: number;
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
}

export interface ICustomerCurrentOrder {
  _id: string;
  trackingId: string;
  farmerEmail: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: Date;
}

export interface ICustomerRecentOrder {
  _id: string;
  trackingId: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: Date;
}

export interface ICustomerDashboard {
  stats: ICustomerDashboardStats;

  currentOrder: ICustomerCurrentOrder | null;

  recentOrders: ICustomerRecentOrder[];
}

export interface ICustomerDashboardResponse {
  success: boolean;
  message: string;
  data: ICustomerDashboard;
}

export type TDashboardOverview =
  | ({ role: "admin" } & IAdminDashboard)
  | ({ role: "farmer" } & IFarmerDashboard)
  | ({ role: "rider" } & IRiderDashboard)
  | ({ role: "user" } & ICustomerDashboard);

export interface IDashboardOverviewResponse {
  success: boolean;
  message: string;
  data: TDashboardOverview;
}
