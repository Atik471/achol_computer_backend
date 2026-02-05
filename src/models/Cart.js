import mongoose from "mongoose";
const { Schema } = mongoose;

const cartItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    // Store discount price if available at time of adding to cart
    discountPrice: {
        type: Number
    }
}, { _id: true });

const cartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true // One cart per user
    },
    items: [cartItemSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Update lastUpdated on any modification
cartSchema.pre("save", function (next) {
    this.lastUpdated = new Date();
    next();
});

// Virtual for cart total
cartSchema.virtual("cartTotal").get(function () {
    return this.items.reduce((total, item) => {
        const itemPrice = item.discountPrice || item.price;
        return total + (itemPrice * item.quantity);
    }, 0);
});

// Virtual for total items count
cartSchema.virtual("itemCount").get(function () {
    return this.items.reduce((count, item) => count + item.quantity, 0);
});

// Method to add item to cart
cartSchema.methods.addItem = function (productId, quantity, price, discountPrice) {
    const existingItemIndex = this.items.findIndex(
        item => item.product.toString() === productId.toString()
    );

    if (existingItemIndex > -1) {
        // Update quantity if item already exists
        this.items[existingItemIndex].quantity += quantity;
    } else {
        // Add new item
        this.items.push({
            product: productId,
            quantity,
            price,
            discountPrice
        });
    }
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function (itemId, quantity) {
    const item = this.items.id(itemId);
    if (item) {
        item.quantity = quantity;
        return true;
    }
    return false;
};

// Method to remove item
cartSchema.methods.removeItem = function (itemId) {
    this.items.pull(itemId);
};

// Method to clear cart
cartSchema.methods.clearCart = function () {
    this.items = [];
};

// Ensure virtuals are included in JSON
cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

// Index for faster lookups
cartSchema.index({ user: 1 });

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
