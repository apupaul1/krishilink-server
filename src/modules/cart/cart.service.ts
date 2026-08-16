import { cartCollection } from "./cart.collection";
import { ObjectId } from "mongodb";
import { IAddToCart, IBuyNow, ICart, ICartItem } from "./cart.interface";
import { productCollection } from "../product/product.service";

const addToCart = async (email: string, payload: IAddToCart) => {
  const { productId, quantity } = payload;

  // --------------------------------
  // 1. Validate product ID
  // --------------------------------

  if (!ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0.");
  }

  const objectId = new ObjectId(productId);

  // --------------------------------
  // 2. Find product
  // --------------------------------

  const product = await productCollection.findOne({
    _id: objectId,
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  // --------------------------------
  // 3. Check stock
  // --------------------------------

  if (product.stock <= 0) {
    throw new Error("Product is out of stock.");
  }

  if (quantity > product.stock) {
    throw new Error("Requested quantity exceeds available stock.");
  }

  // --------------------------------
  // 4. Prepare cart item
  // --------------------------------

  const cartItem: ICartItem = {
    productId: product._id,

    name: product.name,

    image: product.images[0],

    price: product.price,

    quantity,

    unit: product.unit,

    stock: product.stock,

    farmerEmail: product.farmer.email,

    baseDeliveryCharge: product.baseDeliveryCharge ?? 50,

    location: {
      district: product.location.district,

      area: product.location.area,

      address: product.location.address,
    },

    isSelected: true,
  };

  // --------------------------------
  // 5. Check existing cart
  // --------------------------------

  const cart = await cartCollection.findOne({
    customerEmail: email,
  });

  // --------------------------------
  // 6. Create new cart
  // --------------------------------

  if (!cart) {
    const newCart: ICart = {
      customerEmail: email,

      items: [cartItem],

      createdAt: new Date(),

      updatedAt: new Date(),
    };

    await cartCollection.insertOne(newCart);

    return newCart;
  }

  // --------------------------------
  // 7. Check existing item
  // --------------------------------

  const existingItem = cart.items.find(
    (item) => item.productId.toString() === productId,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > product.stock) {
      throw new Error("Requested quantity exceeds available stock.");
    }

    await cartCollection.updateOne(
      {
        _id: cart._id,
        "items.productId": objectId,
      },
      {
        $set: {
          "items.$.quantity": newQuantity,

          "items.$.stock": product.stock,

          "items.$.price": product.price,

          "items.$.isSelected": true,

          updatedAt: new Date(),
        },
      },
    );
  } else {
    // --------------------------------
    // 8. Add new item
    // --------------------------------

    await cartCollection.updateOne(
      {
        _id: cart._id,
      },
      {
        $push: {
          items: cartItem,
        },

        $set: {
          updatedAt: new Date(),
        },
      },
    );
  }

  return await cartCollection.findOne({
    _id: cart._id,
  });
};

const getCart = async (email: string) => {
  const cart = await cartCollection.findOne({
    customerEmail: email,
  });

  if (!cart) {
    return {
      customerEmail: email,
      items: [],
    };
  }

  return cart;
};

const updateQuantity = async (
  email: string,
  productId: string,
  quantity: number,
) => {
  if (!ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0.");
  }

  const objectId = new ObjectId(productId);

  const cart = await cartCollection.findOne({
    customerEmail: email,
  });

  if (!cart) {
    throw new Error("Cart not found.");
  }

  const item = cart.items.find(
    (item) => item.productId.toString() === productId,
  );

  if (!item) {
    throw new Error("Cart item not found.");
  }

  // Always check latest product stock
  const product = await productCollection.findOne({
    _id: objectId,
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  if (quantity > product.stock) {
    throw new Error(`Only ${product.stock} ${product.unit} available.`);
  }

  const result = await cartCollection.updateOne(
    {
      _id: cart._id,
      "items.productId": objectId,
    },
    {
      $set: {
        "items.$.quantity": quantity,
        "items.$.stock": product.stock,
        "items.$.price": product.price,
        updatedAt: new Date(),
      },
    },
  );

  if (!result.modifiedCount) {
    throw new Error("Failed to update cart quantity.");
  }

  return await cartCollection.findOne({
    _id: cart._id,
  });
};

const toggleSelection = async (email: string, productId: string) => {
  if (!ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  const objectId = new ObjectId(productId);

  const cart = await cartCollection.findOne({
    customerEmail: email,
  });

  if (!cart) {
    throw new Error("Cart not found.");
  }

  const item = cart.items.find(
    (item) => item.productId.toString() === productId,
  );

  if (!item) {
    throw new Error("Cart item not found.");
  }

  const newSelection = !item.isSelected;

  await cartCollection.updateOne(
    {
      _id: cart._id,
      "items.productId": objectId,
    },
    {
      $set: {
        "items.$.isSelected": newSelection,
        updatedAt: new Date(),
      },
    },
  );

  return await cartCollection.findOne({
    _id: cart._id,
  });
};

const toggleSelectAll = async (email: string) => {
  const cart = await cartCollection.findOne({
    customerEmail: email,
  });

  if (!cart) {
    throw new Error("Cart not found.");
  }

  if (cart.items.length === 0) {
    return cart;
  }

  const allSelected = cart.items.every((item) => item.isSelected);

  const newSelection = !allSelected;

  await cartCollection.updateOne(
    {
      _id: cart._id,
    },
    {
      $set: {
        "items.$[].isSelected": newSelection,

        updatedAt: new Date(),
      },
    },
  );

  return await cartCollection.findOne({
    _id: cart._id,
  });
};

const removeFromCart = async (email: string, productId: string) => {
  if (!ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  const objectId = new ObjectId(productId);

  const cart = await cartCollection.findOne({
    customerEmail: email,
  });

  if (!cart) {
    throw new Error("Cart not found.");
  }

  const itemExists = cart.items.some(
    (item) => item.productId.toString() === productId,
  );

  if (!itemExists) {
    throw new Error("Cart item not found.");
  }

  await cartCollection.updateOne(
    {
      _id: cart._id,
    },
    {
      $pull: {
        items: {
          productId: objectId,
        },
      },
      $set: {
        updatedAt: new Date(),
      },
    },
  );

  return await cartCollection.findOne({
    _id: cart._id,
  });
};

const clearCart = async (email: string) => {
  const cart = await cartCollection.findOne({
    customerEmail: email,
  });

  if (!cart) {
    return {
      customerEmail: email,
      items: [],
    };
  }

  await cartCollection.updateOne(
    {
      _id: cart._id,
    },
    {
      $set: {
        items: [],
        updatedAt: new Date(),
      },
    },
  );

  return await cartCollection.findOne({
    _id: cart._id,
  });
};

const buyNow = async (email: string, payload: IBuyNow) => {
  const { productId, quantity } = payload;

  if (!ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID.");
  }

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0.");
  }

  const objectId = new ObjectId(productId);

  const product = await productCollection.findOne({
    _id: objectId,
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  if (!product.isAvailable) {
    throw new Error("Product is currently unavailable.");
  }

  if (quantity > product.stock) {
    throw new Error(`Only ${product.stock} ${product.unit} available.`);
  }

  const cartItem: ICartItem = {
    productId: product._id,
    name: product.name,
    image: product.images[0],
    price: product.price,
    quantity,
    unit: product.unit,
    stock: product.stock,
    farmerEmail: product.farmer.email,
    baseDeliveryCharge: product.baseDeliveryCharge ?? 50,
    location: {
      district: product.location.district,
      area: product.location.area,
      address: product.location.address,
    },
  };

  const cart = await cartCollection.findOne({
    customerEmail: email,
  });

  // No cart
  if (!cart) {
    const newCart: ICart = {
      customerEmail: email,
      items: [cartItem],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await cartCollection.insertOne(newCart);

    return newCart;
  }

  const existingItem = cart.items.find(
    (item) => item.productId.toString() === productId,
  );

  if (existingItem) {
    await cartCollection.updateOne(
      {
        _id: cart._id,
        "items.productId": objectId,
      },
      {
        $set: {
          "items.$.quantity": quantity,
          "items.$.stock": product.stock,
          "items.$.price": product.price,
          updatedAt: new Date(),
        },
      },
    );
  } else {
    await cartCollection.updateOne(
      {
        _id: cart._id,
      },
      {
        $push: {
          items: cartItem,
        },
        $set: {
          updatedAt: new Date(),
        },
      },
    );
  }

  return await cartCollection.findOne({
    _id: cart._id,
  });
};

const removeCartItems = async (email: string, productIds: string[]) => {
  if (!productIds || productIds.length === 0) {
    throw new Error("No cart items to remove.");
  }

  const objectIds = productIds.map((id) => {
    if (!ObjectId.isValid(id)) {
      throw new Error(`Invalid product ID: ${id}`);
    }

    return new ObjectId(id);
  });

  const cart = await cartCollection.findOne({
    customerEmail: email,
  });

  if (!cart) {
    return {
      customerEmail: email,
      items: [],
    };
  }

  await cartCollection.updateOne(
    {
      _id: cart._id,
    },
    {
      $pull: {
        items: {
          productId: {
            $in: objectIds,
          },
        },
      },
      $set: {
        updatedAt: new Date(),
      },
    },
  );

  return await cartCollection.findOne({
    _id: cart._id,
  });
};

export const CartService = {
  getCart,
  addToCart,
  updateQuantity,
  toggleSelection,
  toggleSelectAll,
  removeFromCart,
  clearCart,
  buyNow,
  removeCartItems,
};
