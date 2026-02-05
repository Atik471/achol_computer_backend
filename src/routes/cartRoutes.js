import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} from "../controllers/cartController.js";

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.route("/")
    .get(getCart)           // Get user's cart
    .post(addToCart)        // Add item to cart
    .delete(clearCart);     // Clear entire cart

router.route("/:itemId")
    .put(updateCartItem)    // Update item quantity
    .delete(removeFromCart); // Remove item from cart

export default router;
