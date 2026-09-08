import { Router } from "express";
import { createOrder, getMyOrders, getOrderById, getOrders, updateOrderStatus, cancelOrder, confirmOrderDelivered, addOrderComment, addOrderCommentReply } from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";


const orderRouter = Router();

// User routes
orderRouter.post("/", protect, createOrder);
orderRouter.get("/myorders", protect, getMyOrders);
orderRouter.get("/:id", protect, getOrderById);
orderRouter.put("/:id/cancel", protect, cancelOrder);
orderRouter.put("/:id/confirm-delivery", protect, confirmOrderDelivered);
orderRouter.post("/:id/comments", protect, addOrderComment);
orderRouter.post("/:id/comments/:commentId/reply", protect, adminOnly, addOrderCommentReply);

// Admin routes
orderRouter.get("/", protect, adminOnly, getOrders);
orderRouter.put("/:id/status", protect, adminOnly, updateOrderStatus);

export default orderRouter;