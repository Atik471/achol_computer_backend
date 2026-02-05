import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
    createOrder,
    getOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    getAllOrders
} from "../controllers/orderController.js";

const router = express.Router();

// User routes (protected)
router.use(protect);

router.route("/")
    .post(createOrder)      // Create order from cart
    .get(getOrders);        // Get user's orders

router.get("/:id", getOrderById);         // Get single order
router.patch("/:id/cancel", cancelOrder); // Cancel order

// Admin routes
router.get("/admin/all", authorize("admin"), getAllOrders);           // Get all orders (admin)
router.patch("/admin/:id/status", authorize("admin"), updateOrderStatus); // Update order status (admin)

export default router;
