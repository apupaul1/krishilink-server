import { ObjectId } from "mongodb";
import { productCollection } from "../product/product.service";
import { TrackingService } from "../tracking/tracking.service";
import { orderCollection } from "./order.collection";
import {
  ICreateOrder,
  IOrder,
  IOrderProduct,
  IPreparedOrder,
} from "./order.interface";
import { calculateDeliveryCharge, generateTrackingId } from "./order.utils";

export const prepareOrders = async (
  email: string,
  payload: ICreateOrder,
): Promise<IPreparedOrder> => {
  const { products, shippingAddress, paymentMethod } = payload;

  if (!products || products.length === 0) {
    throw new Error("No products found.");
  }

  // ------------------------------------
  // 1. Validate product IDs
  // ------------------------------------

  const productIds = products.map((item) => {
    if (!ObjectId.isValid(item.productId)) {
      throw new Error(`Invalid product ID: ${item.productId}`);
    }

    return new ObjectId(item.productId);
  });

  // ------------------------------------
  // 2. Get products
  // ------------------------------------

  const dbProducts = await productCollection
    .find({
      _id: {
        $in: productIds,
      },
    })
    .toArray();

  if (dbProducts.length !== products.length) {
    throw new Error("One or more products were not found.");
  }

  // ------------------------------------
  // 3. Prepare order items
  // ------------------------------------

  const orderItems = products.map((item) => {
    const product = dbProducts.find(
      (product) => product._id.toString() === item.productId,
    );

    if (!product) {
      throw new Error("Product not found.");
    }

    if (item.quantity <= 0) {
      throw new Error("Invalid product quantity.");
    }

    if (item.quantity > product.stock) {
      throw new Error(`Insufficient stock for ${product.name}.`);
    }

    const orderProduct: IOrderProduct = {
      productId: product._id,
      name: product.name,
      image: product.images[0],
      quantity: item.quantity,
      unit: product.unit,
      price: product.price,
    };

    return {
      ...orderProduct,

      farmerEmail: product.farmer.email,

      farmerLocation: product.location,

      baseDeliveryCharge: product.baseDeliveryCharge ?? 50,
    };
  });

  // ------------------------------------
  // 4. Group products by farmer
  // ------------------------------------

  const farmerGroups = new Map<string, typeof orderItems>();

  for (const item of orderItems) {
    const existing = farmerGroups.get(item.farmerEmail);

    if (existing) {
      existing.push(item);
    } else {
      farmerGroups.set(item.farmerEmail, [item]);
    }
  }

  // ------------------------------------
  // 5. Prepare orders
  // ------------------------------------

  const orders: IOrder[] = [];

  for (const [farmerEmail, items] of farmerGroups.entries()) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const firstItem = items[0];

    const deliveryCharge = calculateDeliveryCharge(
      firstItem.farmerLocation,
      {
        district: shippingAddress.district,
        area: shippingAddress.area,
      },
      firstItem.baseDeliveryCharge,
    );

    const totalAmount = subtotal + deliveryCharge;

    const order: IOrder = {
      trackingId: generateTrackingId(),

      customerEmail: email,

      farmerEmail,

      farmerLocation: {
        district: firstItem.farmerLocation.district,
        area: firstItem.farmerLocation.area,
        address: firstItem.farmerLocation.address,
      },

      items: items.map(
        ({
          farmerEmail: _farmerEmail,
          farmerLocation: _farmerLocation,
          baseDeliveryCharge: _baseDeliveryCharge,
          ...orderItem
        }) => orderItem,
      ),

      shippingAddress,

      subtotal,

      deliveryCharge,

      totalAmount,

      paymentMethod,

      // Default
      // SSL success হলে পরে paid করে দেব
      paymentStatus: "pending",

      orderStatus: "pending",

      riderEmail: null,

      createdAt: new Date(),

      updatedAt: new Date(),
    };

    orders.push(order);
  }

  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return {
    orders,
    totalAmount,
  };
};

export const insertOrders = async (orders: IOrder[]) => {
  if (!orders.length) {
    throw new Error("No orders to insert.");
  }

  const result = await orderCollection.insertMany(orders);

  const insertedOrders = orders.map((order, index) => ({
    ...order,
    _id: result.insertedIds[index],
  }));

  // Tracking log
  for (const order of insertedOrders) {
    await TrackingService.logTracking(order.trackingId, order.orderStatus);
  }

  return insertedOrders;
};
