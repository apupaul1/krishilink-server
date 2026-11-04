import { orderCollection } from "../order/order.collection";
import { productCollection } from "../product/product.service";
import { riderCollection } from "../rider/rider.service";
import { userCollection } from "../user/user.service";
import { farmerCollection } from "../farmer/farmer.service";

const getAdminDashboard = async () => {
  // --------------------------------
  // 1. Total Revenue
  // --------------------------------

  const revenueResult = await orderCollection
    .aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
        },
      },
    ])
    .toArray();

  const totalRevenue = revenueResult[0]?.totalRevenue ?? 0;

  // --------------------------------
  // 2. Total Orders
  // --------------------------------

  const totalOrders = await orderCollection.countDocuments();

  // --------------------------------
  // 3. Active Farmers
  // --------------------------------

  const activeFarmers = await userCollection.countDocuments({
    role: "farmer",
  });

  // --------------------------------
  // 4. Active Riders
  // --------------------------------

  const activeRiders = await riderCollection.countDocuments({
    status: "approved",
  });

  // --------------------------------
  // 5. Platform Inventory & Queue
  // --------------------------------

  const totalCustomers = await userCollection.countDocuments({
    role: "user",
  });

  const totalProducts = await productCollection.countDocuments();

  const pendingFarmerApplications = await farmerCollection.countDocuments({
    status: "pending",
  });

  const pendingRiderApplications = await riderCollection.countDocuments({
    status: "pending",
  });

  // --------------------------------
  // 6. Last 6 Months Revenue
  // --------------------------------

  const now = new Date();

  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const revenueRes = await orderCollection
    .aggregate([
      {
        $match: {
          paymentStatus: "paid",

          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },

      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },

            month: {
              $month: "$createdAt",
            },
          },

          revenue: {
            $sum: "$totalAmount",
          },
        },
      },

      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ])
    .toArray();

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const revenueMap = new Map<string, number>();

  for (const item of revenueRes) {
    const key = `${item._id.year}-${item._id.month}`;

    revenueMap.set(key, item.revenue);
  }

  const revenueOverview = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const key = `${year}-${month}`;

    return {
      month: monthNames[month - 1],
      revenue: revenueMap.get(key) ?? 0,
    };
  });

  // --------------------------------
  // 6. Order Status Overview
  // --------------------------------

  const orderOverview = await orderCollection
    .aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ])
    .toArray();

  // --------------------------------
  // 7. Top Selling Products
  // --------------------------------

  const topProducts = await orderCollection
    .aggregate([
      {
        $match: {
          orderStatus: {
            $ne: "cancelled",
          },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.productId",

          name: {
            $first: "$items.name",
          },

          quantity: {
            $sum: "$items.quantity",
          },
        },
      },
      {
        $sort: {
          quantity: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          _id: 0,
          name: 1,
          quantity: 1,
        },
      },
    ])
    .toArray();

  // --------------------------------
  // 8. Recent Orders
  // --------------------------------

  const recentOrders = await orderCollection
    .find({})
    .sort({
      createdAt: -1,
    })
    .limit(5)
    .project({
      trackingId: 1,
      customerEmail: 1,
      farmerEmail: 1,
      totalAmount: 1,
      orderStatus: 1,
      createdAt: 1,
    })
    .toArray();

  // --------------------------------
  // 9. Return Dashboard
  // --------------------------------

  return {
    stats: {
      totalRevenue,
      totalOrders,
      activeFarmers,
      activeRiders,
      totalCustomers,
      totalProducts,
      pendingFarmerApplications,
      pendingRiderApplications,
    },

    revenueOverview,

    orderOverview,

    topProducts,

    recentOrders: recentOrders.map((order) => ({
      _id: order._id!.toString(),
      trackingId: order.trackingId,
      customerEmail: order.customerEmail,
      farmerEmail: order.farmerEmail,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
    })),
  };
};

const getFarmerDashboard = async (email: string) => {
  // --------------------------------
  // 1. Farmer Sales + Orders
  // --------------------------------

  const farmerOrderStats = await orderCollection
    .aggregate([
      {
        $unwind: "$items",
      },

      {
        $match: {
          farmerEmail: email,
        },
      },

      {
        $group: {
          _id: "$_id",

          orderStatus: {
            $first: "$orderStatus",
          },

          createdAt: {
            $first: "$createdAt",
          },

          farmerSales: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity"],
            },
          },
        },
      },

      {
        $group: {
          _id: null,

          totalSales: {
            $sum: {
              $cond: [
                {
                  $eq: ["$orderStatus", "delivered"],
                },
                "$farmerSales",
                0,
              ],
            },
          },

          totalOrders: {
            $sum: 1,
          },
        },
      },
    ])
    .toArray();

  const totalSales = farmerOrderStats[0]?.totalSales ?? 0;

  const totalOrders = farmerOrderStats[0]?.totalOrders ?? 0;

  // --------------------------------
  // 2. Active Products
  // --------------------------------

  const activeProducts = await productCollection.countDocuments({
    "farmer.email": email,
    isAvailable: true,
    stock: {
      $gt: 0,
    },
  });

  // --------------------------------
  // 3. Pending Orders
  // --------------------------------

  const pendingOrderResult = await orderCollection
    .aggregate([
      {
        $unwind: "$items",
      },

      {
        $match: {
          farmerEmail: email,

          orderStatus: "pending",
        },
      },

      {
        $group: {
          _id: "$_id",
        },
      },

      {
        $count: "count",
      },
    ])
    .toArray();

  const pendingOrders = pendingOrderResult[0]?.count ?? 0;

  // --------------------------------
  // Pending Orders
  // --------------------------------

  const pendingOrderList = await orderCollection
    .aggregate([
      {
        $unwind: "$items",
      },

      {
        $match: {
          farmerEmail: email,
          orderStatus: "pending",
        },
      },

      {
        $group: {
          _id: "$_id",

          trackingId: {
            $first: "$trackingId",
          },

          customerEmail: {
            $first: "$customerEmail",
          },

          createdAt: {
            $first: "$createdAt",
          },

          farmerTotal: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity"],
            },
          },
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $limit: 5,
      },
    ])
    .toArray();

  // --------------------------------
  // 4. Last 6 Months Sales
  // --------------------------------

  const now = new Date();

  const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const salesResult = await orderCollection
    .aggregate([
      {
        $unwind: "$items",
      },

      {
        $match: {
          farmerEmail: email,

          orderStatus: {
            $eq: "delivered",
          },

          createdAt: {
            $gte: startDate,
            $lte: now,
          },
        },
      },

      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },

            month: {
              $month: "$createdAt",
            },
          },

          sales: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity"],
            },
          },
        },
      },

      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ])
    .toArray();

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const salesMap = new Map<string, number>();

  for (const item of salesResult) {
    const key = `${item._id.year}-${item._id.month}`;

    salesMap.set(key, item.sales);
  }

  const salesOverview = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);

    const year = date.getFullYear();

    const month = date.getMonth() + 1;

    const key = `${year}-${month}`;

    return {
      month: monthNames[month - 1],
      sales: salesMap.get(key) ?? 0,
    };
  });

  // --------------------------------
  // 5. Order Status Overview
  // --------------------------------

  const orderOverview = await orderCollection
    .aggregate([
      {
        $unwind: "$items",
      },

      {
        $match: {
          farmerEmail: email,
        },
      },

      {
        $group: {
          _id: {
            orderId: "$_id",
            status: "$orderStatus",
          },
        },
      },

      {
        $group: {
          _id: "$_id.status",

          count: {
            $sum: 1,
          },
        },
      },

      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },

      {
        $sort: {
          count: -1,
        },
      },
    ])
    .toArray();

  // --------------------------------
  // 6. Top Selling Products
  // --------------------------------

  const topProducts = await orderCollection
    .aggregate([
      {
        $unwind: "$items",
      },

      {
        $match: {
          farmerEmail: email,

          orderStatus: {
            $ne: "cancelled",
          },
        },
      },

      {
        $group: {
          _id: "$items.productId",

          name: {
            $first: "$items.name",
          },

          quantity: {
            $sum: "$items.quantity",
          },
        },
      },

      {
        $sort: {
          quantity: -1,
        },
      },

      {
        $limit: 5,
      },

      {
        $project: {
          _id: 0,
          name: 1,
          quantity: 1,
        },
      },
    ])
    .toArray();

  // --------------------------------
  // 7. Recent Orders
  // --------------------------------

  const recentOrders = await orderCollection
    .aggregate([
      {
        $unwind: "$items",
      },

      {
        $match: {
          farmerEmail: email,
        },
      },

      {
        $group: {
          _id: "$_id",

          trackingId: {
            $first: "$trackingId",
          },

          customerEmail: {
            $first: "$customerEmail",
          },

          orderStatus: {
            $first: "$orderStatus",
          },

          createdAt: {
            $first: "$createdAt",
          },

          farmerTotal: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity"],
            },
          },
        },
      },

      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $limit: 5,
      },
    ])
    .toArray();

  // --------------------------------
  // Inventory Alerts
  // --------------------------------

  const inventoryAlerts = await productCollection
    .find({
      "farmer.email": email,
      isAvailable: true,
      stock: {
        $gt: 0,
        $lte: 5,
      },
    })
    .sort({
      stock: 1,
    })
    .limit(5)
    .project({
      name: 1,
      images: 1,
      stock: 1,
      unit: 1,
      price: 1,
    })
    .toArray();

  // --------------------------------
  // 8. Return
  // --------------------------------

  return {
    stats: {
      totalSales,
      totalOrders,
      activeProducts,
      pendingOrders,
    },

    salesOverview,

    orderOverview,

    topProducts,

    recentOrders: recentOrders.map((order) => ({
      _id: order._id.toString(),

      trackingId: order.trackingId,

      customerEmail: order.customerEmail,

      totalAmount: order.farmerTotal,

      orderStatus: order.orderStatus,

      createdAt: order.createdAt,
    })),

    inventoryAlerts: inventoryAlerts.map((product) => ({
      _id: product._id.toString(),
      name: product.name,
      image: product.images?.[0],
      stock: product.stock,
      unit: product.unit,
      price: product.price,
    })),

    pendingOrders: pendingOrderList.map((order) => ({
      _id: order._id.toString(),
      trackingId: order.trackingId,
      customerEmail: order.customerEmail,
      totalAmount: order.farmerTotal,
      createdAt: order.createdAt,
    })),
  };
};

const getRiderDashboard = async (email: string) => {
  // --------------------------------
  // 1. Current Delivery
  // --------------------------------

  const currentDelivery = await orderCollection.findOne(
    {
      riderEmail: email,

      orderStatus: {
        $in: ["picked_up", "out_for_delivery"],
      },
    },
    {
      projection: {
        trackingId: 1,
        customerEmail: 1,
        shippingAddress: 1,
        farmerLocation: 1,
        totalAmount: 1,
        deliveryCharge: 1,
        orderStatus: 1,
        createdAt: 1,
      },
    },
  );

  // --------------------------------
  // 2. Pending Acceptance
  // --------------------------------

  const pendingAcceptance = await orderCollection.countDocuments({
    riderEmail: email,
    orderStatus: "waiting_for_rider_acceptance",
  });

  // --------------------------------
  // 3. Active Delivery
  // --------------------------------

  const activeDelivery = await orderCollection.countDocuments({
    riderEmail: email,

    orderStatus: {
      $in: ["picked_up", "out_for_delivery"],
    },
  });

  // --------------------------------
  // 4. Completed Deliveries
  // --------------------------------

  const completedDeliveries = await orderCollection.countDocuments({
    riderEmail: email,
    orderStatus: "delivered",
  });

  // --------------------------------
  // 5. Total Earnings
  // --------------------------------

  const earningsResult = await orderCollection
    .aggregate([
      {
        $match: {
          riderEmail: email,
          orderStatus: "delivered",
        },
      },

      {
        $group: {
          _id: null,

          totalEarnings: {
            $sum: "$deliveryCharge",
          },
        },
      },
    ])
    .toArray();

  const totalEarnings = earningsResult[0]?.totalEarnings ?? 0;

  // --------------------------------
  // 6. Delivery Queue
  // --------------------------------

  const deliveryQueue = await orderCollection
    .find({
      riderEmail: email,

      orderStatus: "waiting_for_rider_acceptance",
    })
    .sort({
      createdAt: -1,
    })
    .limit(5)
    .project({
      trackingId: 1,
      shippingAddress: 1,
      farmerLocation: 1,
      deliveryCharge: 1,
      orderStatus: 1,
      createdAt: 1,
    })
    .toArray();

  // --------------------------------
  // 7. Recent Deliveries
  // --------------------------------

  const recentDeliveries = await orderCollection
    .find({
      riderEmail: email,
      orderStatus: "delivered",
    })
    .sort({
      updatedAt: -1,
    })
    .limit(5)
    .project({
      trackingId: 1,
      shippingAddress: 1,
      deliveryCharge: 1,
      orderStatus: 1,
      createdAt: 1,
    })
    .toArray();

  // --------------------------------
  // 8. Return
  // --------------------------------

  return {
    stats: {
      activeDelivery,
      pendingAcceptance,
      completedDeliveries,
      totalEarnings,
    },

    currentDelivery: currentDelivery
      ? {
          _id: currentDelivery._id.toString(),

          trackingId: currentDelivery.trackingId,

          customerEmail: currentDelivery.customerEmail,

          customerName: currentDelivery.shippingAddress.name,

          customerPhone: currentDelivery.shippingAddress.phone,

          pickupLocation: currentDelivery.farmerLocation,

          deliveryLocation: {
            district: currentDelivery.shippingAddress.district,

            area: currentDelivery.shippingAddress.area,

            address: currentDelivery.shippingAddress.address,
          },

          totalAmount: currentDelivery.totalAmount,

          deliveryCharge: currentDelivery.deliveryCharge,

          orderStatus: currentDelivery.orderStatus,

          createdAt: currentDelivery.createdAt,
        }
      : null,

    deliveryQueue: deliveryQueue.map((order) => ({
      _id: order._id.toString(),

      trackingId: order.trackingId,

      customerName: order.shippingAddress.name,

      customerPhone: order.shippingAddress.phone,

      pickupLocation: order.farmerLocation,

      deliveryLocation: {
        district: order.shippingAddress.district,

        area: order.shippingAddress.area,

        address: order.shippingAddress.address,
      },

      deliveryCharge: order.deliveryCharge,

      orderStatus: order.orderStatus,

      createdAt: order.createdAt,
    })),

    recentDeliveries: recentDeliveries.map((order) => ({
      _id: order._id.toString(),

      trackingId: order.trackingId,

      customerName: order.shippingAddress.name,

      deliveryLocation: {
        district: order.shippingAddress.district,

        area: order.shippingAddress.area,
      },

      deliveryCharge: order.deliveryCharge,

      orderStatus: order.orderStatus,

      createdAt: order.createdAt,
    })),
  };
};

const getUserDashboard = async (email: string) => {
  // --------------------------------
  // 1. Total Orders
  // --------------------------------

  const totalOrders = await orderCollection.countDocuments({
    customerEmail: email,
  });

  // --------------------------------
  // 2. Delivered Orders
  // --------------------------------

  const deliveredOrders = await orderCollection.countDocuments({
    customerEmail: email,
    orderStatus: "delivered",
  });

  // --------------------------------
  // 3. Active Orders
  // --------------------------------

  const activeOrders = await orderCollection.countDocuments({
    customerEmail: email,

    orderStatus: {
      $nin: ["delivered", "cancelled"],
    },
  });

  // --------------------------------
  // 4. Total Spent
  // --------------------------------

  const spentResult = await orderCollection
    .aggregate([
      {
        $match: {
          customerEmail: email,
          orderStatus: "delivered",
        },
      },

      {
        $group: {
          _id: null,

          totalSpent: {
            $sum: "$totalAmount",
          },
        },
      },
    ])
    .toArray();

  const totalSpent = spentResult[0]?.totalSpent ?? 0;

  // --------------------------------
  // 5. Current Order
  // --------------------------------

  const currentOrder = await orderCollection.findOne(
    {
      customerEmail: email,

      orderStatus: {
        $nin: ["delivered", "cancelled"],
      },
    },
    {
      projection: {
        trackingId: 1,
        farmerEmail: 1,
        totalAmount: 1,
        orderStatus: 1,
        createdAt: 1,
      },
    },
  );

  // --------------------------------
  // 6. Recent Orders
  // --------------------------------

  const recentOrders = await orderCollection
    .find({
      customerEmail: email,
    })
    .sort({
      createdAt: -1,
    })
    .limit(5)
    .project({
      trackingId: 1,
      totalAmount: 1,
      orderStatus: 1,
      paymentStatus: 1,
      createdAt: 1,
    })
    .toArray();

  // --------------------------------
  // 7. Return
  // --------------------------------

  return {
    stats: {
      totalSpent,
      totalOrders,
      activeOrders,
      deliveredOrders,
    },

    currentOrder: currentOrder
      ? {
          _id: currentOrder._id.toString(),

          trackingId: currentOrder.trackingId,

          farmerEmail: currentOrder.farmerEmail,

          totalAmount: currentOrder.totalAmount,

          orderStatus: currentOrder.orderStatus,

          createdAt: currentOrder.createdAt,
        }
      : null,

    recentOrders: recentOrders.map((order) => ({
      _id: order._id.toString(),

      trackingId: order.trackingId,

      totalAmount: order.totalAmount,

      orderStatus: order.orderStatus,

      paymentStatus: order.paymentStatus,

      createdAt: order.createdAt,
    })),
  };
};

/**
 * Resolves the caller's role and returns the matching dashboard payload.
 * Useful for a single "home" request when the client does not yet know the role.
 */
const getDashboardOverview = async (email: string) => {
  const user = await userCollection.findOne({ email });

  if (!user) {
    const error = new Error("User not found.") as Error & {
      statusCode?: number;
    };

    error.statusCode = 404;

    throw error;
  }

  switch (user.role) {
    case "admin":
      return {
        role: user.role,
        ...(await getAdminDashboard()),
      };

    case "farmer":
      return {
        role: user.role,
        ...(await getFarmerDashboard(email)),
      };

    case "rider":
      return {
        role: user.role,
        ...(await getRiderDashboard(email)),
      };

    default:
      return {
        role: user.role,
        ...(await getUserDashboard(email)),
      };
  }
};

export const DashboardService = {
  getDashboardOverview,
  getAdminDashboard,
  getFarmerDashboard,
  getRiderDashboard,
  getUserDashboard,
};
