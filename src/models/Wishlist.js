import mongoose from "mongoose";
const { Schema } = mongoose;

const wishlistSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true // One wishlist per user
    },
    products: [{
        type: Schema.Types.ObjectId,
        ref: "Product"
    }]
}, { timestamps: true });

// Limit wishlist to 50 items
wishlistSchema.pre("save", function (next) {
    if (this.products.length > 50) {
        const error = new Error("Wishlist cannot contain more than 50 items");
        return next(error);
    }
    next();
});

// Method to add product to wishlist
wishlistSchema.methods.addProduct = function (productId) {
    if (this.products.length >= 50) {
        throw new Error("Wishlist is full (maximum 50 items)");
    }

    const exists = this.products.some(
        id => id.toString() === productId.toString()
    );

    if (!exists) {
        this.products.push(productId);
        return true;
    }
    return false; // Already in wishlist
};

// Method to remove product from wishlist
wishlistSchema.methods.removeProduct = function (productId) {
    const index = this.products.findIndex(
        id => id.toString() === productId.toString()
    );

    if (index > -1) {
        this.products.splice(index, 1);
        return true;
    }
    return false;
};

// Method to check if product is in wishlist
wishlistSchema.methods.hasProduct = function (productId) {
    return this.products.some(
        id => id.toString() === productId.toString()
    );
};

// Method to clear wishlist
wishlistSchema.methods.clearWishlist = function () {
    this.products = [];
};

// Index for faster lookups
wishlistSchema.index({ user: 1 });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
