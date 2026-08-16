import { ProductService } from "./../product/product.service";
import { insertOrders, prepareOrders } from "./../order/order.helper";
import axios from "axios";
import crypto from "crypto";
import { IPayment, ISSLCallback } from "./payment.interface";
import { ICreateOrder } from "../order/order.interface";
import { paymentCollection } from "./payment.collection";
import { CartService } from "../cart/cart.service";
import { ObjectId } from "mongodb";
import { OrderService } from "../order/order.service";

export interface IGetPaymentsQuery {
  email?: string;
}

const generateTransactionId = () => {
  return `TRX-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
};

const initiateSSLCommerzPayment = async ({
  email,
  payload,
  amount,
}: {
  email: string;
  payload: ICreateOrder;
  amount: number;
}) => {
  const transactionId = generateTransactionId();

  const cartProductIds = payload.products.map(
    (product) => new ObjectId(product.productId),
  );

  // -----------------------------
  // 1. Create pending payment
  // -----------------------------

  const payment: IPayment = {
    transactionId,

    customerEmail: email,

    orderPayload: payload,

    amount,

    paymentMethod: "sslcommerz",

    status: "pending",

    cartProductIds,

    createdAt: new Date(),

    updatedAt: new Date(),
  };

  await paymentCollection.insertOne(payment);

  // -----------------------------
  // 2. SSLCommerz URL
  // -----------------------------

  const sslCommerzUrl =
    process.env.SSLCOMMERZ_SANDBOX === "true"
      ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
      : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

  // -----------------------------
  // 3. SSLCommerz payload
  // -----------------------------

  const sslPayload = {
    store_id: process.env.SSLCOMMERZ_STORE_ID!,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD!,

    total_amount: amount,
    currency: "BDT",

    tran_id: transactionId,

    success_url: `${process.env.BACKEND_URL}/api/v1/payments/success`,

    fail_url: `${process.env.BACKEND_URL}/api/v1/payments/fail`,

    cancel_url: `${process.env.BACKEND_URL}/api/v1/payments/cancel`,

    ipn_url: `${process.env.BACKEND_URL}/api/v1/payments/ipn`,

    product_category: "agricultural_products",
    product_profile: "physical-goods",

    product_name: "KrishiLink Products",

    cus_name: payload.shippingAddress.name,
    cus_email: email,
    cus_phone: payload.shippingAddress.phone,

    cus_add1: payload.shippingAddress.address,
    cus_city: payload.shippingAddress.district,
    cus_state: payload.shippingAddress.area,
    cus_country: "Bangladesh",

    ship_name: payload.shippingAddress.name,
    ship_add1: payload.shippingAddress.address,
    ship_city: payload.shippingAddress.district,
    ship_state: payload.shippingAddress.area,
    ship_country: "Bangladesh",

    num_of_item: payload.products.length,

    product_amount: amount,
    vat: 0,
    discount_amount: 0,
    convenience_fee: 0,
  };

  // -----------------------------
  // 4. Convert to URL encoded
  // -----------------------------

  const formData = new URLSearchParams();

  Object.entries(sslPayload).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  // -----------------------------
  // 5. Send request to SSLCommerz
  // -----------------------------

  try {
    const response = await axios.post(sslCommerzUrl, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },

      timeout: 30000,
    });

    // console.log("SSLCommerz Response:", response.data);

    if (response.data?.status !== "SUCCESS") {
      throw new Error(
        response.data?.failedreason || "Failed to initiate SSLCommerz payment.",
      );
    }

    // -----------------------------
    // 6. Return gateway URL
    // -----------------------------

    return {
      transactionId,

      amount,

      gatewayPageURL: response.data.GatewayPageURL,
    };
  } catch (error) {
    // SSL session creation failed
    await paymentCollection.updateOne(
      {
        transactionId,
      },
      {
        $set: {
          status: "failed",
          updatedAt: new Date(),
        },
      },
    );

    throw error;
  }
};

const validateSSLCommerzTransaction = async (valId: string) => {
  const validationUrl =
    process.env.SSLCOMMERZ_SANDBOX === "true"
      ? "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
      : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

  const response = await axios.get(validationUrl, {
    params: {
      val_id: valId,
      store_id: process.env.SSLCOMMERZ_STORE_ID,
      store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD,
      format: "json",
    },
    timeout: 30000,
  });

  return response.data;
};

const completeSSLCommerzPayment = async (callbackData: ISSLCallback) => {
  const tranId = callbackData.tran_id;

  const valId = callbackData.val_id;

  if (!tranId) {
    throw new Error("Transaction ID is missing.");
  }

  if (!valId) {
    throw new Error("Validation ID is missing.");
  }

  // --------------------------------
  // 1. Find payment
  // --------------------------------

  const payment = await paymentCollection.findOne({
    transactionId: tranId,
  });

  if (!payment) {
    throw new Error("Payment transaction not found.");
  }

  // --------------------------------
  // 2. Prevent duplicate processing
  // --------------------------------

  if (payment.status === "paid") {
    return {
      transactionId: payment.transactionId,

      orders: [],
    };
  }

  // --------------------------------
  // 3. Validate with SSLCommerz
  // --------------------------------

  const validation = await validateSSLCommerzTransaction(valId);

  console.log("SSL Validation Response:", validation);

  // --------------------------------
  // 4. Check validation status
  // --------------------------------

  if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
    await paymentCollection.updateOne(
      {
        _id: payment._id,
      },
      {
        $set: {
          status: "failed",
          updatedAt: new Date(),
        },
      },
    );

    throw new Error(`Payment validation failed: ${validation.status}`);
  }

  // --------------------------------
  // 5. Check amount
  // --------------------------------

  const paidAmount = Number(validation.amount);

  if (Number.isNaN(paidAmount) || paidAmount !== payment.amount) {
    throw new Error("Payment amount mismatch.");
  }

  // --------------------------------
  // 6. Check currency
  // --------------------------------

  if (validation.currency !== "BDT") {
    throw new Error("Invalid payment currency.");
  }

  // --------------------------------
  // 7. Prepare orders
  // --------------------------------

  const prepared = await prepareOrders(
    payment.customerEmail,
    payment.orderPayload,
  );

  // --------------------------------
  // 8. VERY IMPORTANT
  // SSL payment successful
  // So every order = paid
  // --------------------------------

  const paidOrders = prepared.orders.map((order) => ({
    ...order,

    paymentStatus: "paid" as const,
  }));

  // --------------------------------
  // 9. Insert ALL orders
  // --------------------------------

  const orders = await insertOrders(paidOrders);

  // Decrease product stock
  await OrderService.decreaseStockForOrders(orders);

  // --------------------------------
  // 10. Get all order IDs
  // --------------------------------

  const orderIds = orders.map((order) => order._id!);

  // --------------------------------
  // 11. Update payment
  // --------------------------------

  await paymentCollection.updateOne(
    {
      _id: payment._id,
    },
    {
      $set: {
        status: "paid",

        valId,

        orderIds,

        updatedAt: new Date(),
      },
    },
  );

  try {
    await CartService.removeCartItems(
      payment.customerEmail,
      payment.cartProductIds.map((id) => id.toString()),
    );
  } catch (error) {
    console.error("Failed to remove purchased cart items:", error);
  }

  // await CartService.clearCart(payment.customerEmail);

  // --------------------------------
  // 12. Return
  // --------------------------------

  return {
    transactionId: payment.transactionId,

    orders,
  };
};

const markPaymentAsFailed = async (transactionId: string) => {
  const payment = await paymentCollection.findOne({
    transactionId,
  });

  if (!payment) {
    throw new Error("Payment not found.");
  }

  await paymentCollection.updateOne(
    {
      _id: payment._id,
    },
    {
      $set: {
        status: "failed",
        updatedAt: new Date(),
      },
    },
  );

  return payment;
};

const markPaymentAsCancelled = async (transactionId: string) => {
  const payment = await paymentCollection.findOne({
    transactionId,
  });

  if (!payment) {
    throw new Error("Payment not found.");
  }

  await paymentCollection.updateOne(
    {
      _id: payment._id,
    },
    {
      $set: {
        status: "cancelled",
        updatedAt: new Date(),
      },
    },
  );

  return payment;
};

const getAllPayments = async ({ email }: IGetPaymentsQuery) => {
  const query: Record<string, unknown> = {};

  if (email) {
    query.customerEmail = email;
  }

  const payments = await paymentCollection
    .find(query)
    .sort({
      createdAt: -1,
    })
    .toArray();

  return payments;
};

export const PaymentService = {
  initiateSSLCommerzPayment,
  completeSSLCommerzPayment,
  markPaymentAsCancelled,
  markPaymentAsFailed,
  getAllPayments,
};
