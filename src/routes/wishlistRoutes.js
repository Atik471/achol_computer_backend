import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    moveToCart
} from "../controllers/wishlistController.js";

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

router.route("/")
    .get(getWishlist)         // Get user's wishlist
    .post(addToWishlist)      // Add product to wishlist
    .delete(clearWishlist);   // Clear entire wishlist

router.post("/move-to-cart/:productId", moveToCart); // Move item to cart

router.delete("/:productId", removeFromWishlist); // Remove product from wishlist

export default router;
