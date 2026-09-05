import { Router } from "express";
import { createOrder, getMyOrders, getOrderById, getOrders, updateOrderStatus, cancelOrder, addOrderComment } from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";


const orderRouter = Router();

// User routes
orderRouter.post("/", protect, createOrder);
orderRouter.get("/myorders", protect, getMyOrders);
orderRouter.get("/:id", protect, getOrderById);
orderRouter.put("/:id/cancel", protect, cancelOrder);
orderRouter.post("/:id/comments", protect, addOrderComment);

// Admin routes
orderRouter.get("/", protect, adminOnly, getOrders);
orderRouter.put("/:id/status", protect, adminOnly, updateOrderStatus);

export default orderRouter;