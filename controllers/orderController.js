import Order from "../models/orderModel.js";
import Notification from "../models/notificationModel.js";
import asyncHandler from "express-async-handler";
import Food from "../models/foodModel.js";
import Setting from "../models/settingModel.js";
import {
    sanitizeString,
    isAllowedLagosCity,
    validateOrderItems,
    getConfiguredDeliveryFee,
    notifyOrderEvent,
} from "./orderControllerHelpers.js";


// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {

    const { orderItems, orderType, deliveryAddress } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0)
    {
        return res.status(400).json({ message: "No order items" });
    }

    if (!orderType || !["delivery", "pickup"].includes(orderType))
    {
        return res.status(400).json({ message: "Invalid order type" });
    }



    if (orderType === "delivery")
    {
        if (!deliveryAddress?.address || !deliveryAddress?.city || !deliveryAddress?.phone)
        {
            return res.status(400).json({ message: "Delivery address is required" });
        }
        // sanitize incoming delivery address
        deliveryAddress.address = sanitizeString(deliveryAddress.address);
        deliveryAddress.landmark = sanitizeString(deliveryAddress.landmark || "");
        deliveryAddress.city = sanitizeString(deliveryAddress.city);
        deliveryAddress.phone = sanitizeString(deliveryAddress.phone);

        // restrict to Lagos using explicit LGA whitelist (city = LGA)
        if (!isAllowedLagosCity(deliveryAddress.city))
        {
            return res.status(400).json({ message: "Delivery is available to Lagos addresses only" });
        }
    }

    const configuredDeliveryFee = await getConfiguredDeliveryFee(Setting);
    const orderDeliveryFee = orderType === "delivery" ? configuredDeliveryFee : 0;

    const validationError = validateOrderItems(orderItems);
    if (validationError)
    {
        return res.status(400).json({ message: validationError });
    }

    // ✅ Fetch all foods at once
    const foodIds = orderItems.map(item => item.food);
    const foodDocs = await Food.find({ _id: { $in: foodIds } });

    const foodMap = {};
    foodDocs.forEach(food => {
        foodMap[food._id.toString()] = food;
    });

    const updatedOrderItems = [];

    for (const item of orderItems)
    {
        const food = foodMap[item.food];

        if (!food)
        {
            return res.status(404).json({ message: `Food item not found in order` });
        }

        if (!food.available)
        {
            return res.status(400).json({ message: `Food item "${food.name}" is currently unavailable` });
        }

        updatedOrderItems.push({
            food: item.food,
            qty: item.qty,
            price: food.price
        });
    }

    const itemsTotal = updatedOrderItems.reduce(
        (acc, item) => acc + item.price * item.qty,
        0
    );

    const order = new Order({
        user: req.user._id,
        orderItems: updatedOrderItems,
        deliveryAddress: orderType === "delivery" ? deliveryAddress : undefined,

        deliveryFee: orderDeliveryFee,
        totalPrice: itemsTotal + orderDeliveryFee,
        orderType
    });


    const createdOrder = await order.save();
    // return populated order so frontend can show food names/images immediately
    const populatedOrder = await Order.findById(createdOrder._id).populate(
        "orderItems.food",
        "name price preparationTime image"
    );
    // also populate user phone/email for admin/frontend convenience
    const populatedWithUser = await Order.findById(populatedOrder._id)
        .populate("orderItems.food", "name price preparationTime image")
        .populate("user", "name email phone");

    try
    {
        await notifyOrderEvent({
            Notification,
            recipientRole: "admin",
            order: populatedWithUser._id,
            message: `New order #${populatedWithUser._id} received from ${req.user?.name || "customer"}.`,
            type: "system",
        });
    } catch (e)
    {
        console.error("Failed to create admin order notification", e);
    }

    res.status(201).json(populatedWithUser);
});

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private 
const getMyOrders = asyncHandler(async (req, res) => {

    const orders = await Order.find({ user: req.user._id, isDeleted: false })
        .populate("orderItems.food", "name price preparationTime image")
        .populate("comments.user", "name email")
        .populate("comments.replies.user", "name email")
        .sort({ createdAt: -1 });
    res.json(orders);

});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {

    const order = await Order.findOne({
        _id: req.params.id,
        user: req.user._id,
        isDeleted: false
    }).populate("orderItems.food", "name price preparationTime image");

    if (order)
    {
        res.json(order);
    } else
    {
        res.status(404).json({ message: "Order not found" });
    }

});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private (Admin)
const getOrders = asyncHandler(async (req, res) => {

    const orders = await Order.find({ isDeleted: false })
        .populate("orderItems.food", "name price preparationTime image")
        .populate("user", "name email phone")
        .populate("comments.user", "name email")
        .populate("comments.replies.user", "name email")
        .sort({ createdAt: -1 });

    res.json(orders);

});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {

    const adminAllowedStatuses = ["pending", "confirmed", "onTheWay", "availableForPickup", "preparing"];

    const { status } = req.body;

    if (!adminAllowedStatuses.includes(status))
    {
        return res.status(400).json({ message: "Delivery and cancellation must be confirmed by the customer." });
    }

    const order = await Order.findOne({
        _id: req.params.id,
        isDeleted: false
    }).populate("orderItems.food");

    if (!order)
    {
        return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    order.isDelivered = false;
    order.deliveredAt = null;

    const saved = await order.save();
    const updatedOrder = await Order.findById(saved._id)
        .populate("orderItems.food", "name price preparationTime image")
        .populate("user", "name email phone");

    try
    {
        await notifyOrderEvent({
            Notification,
            recipientUser: updatedOrder.user._id,
            order: updatedOrder._id,
            message: `Order #${updatedOrder._id} status updated to ${updatedOrder.status}`,
            type: "status",
        });
    } catch (e)
    {
        console.error("Failed to create notification", e);
    }

    res.json(updatedOrder);
});

// @desc    Customer confirms delivery
// @route   PUT /api/orders/:id/confirm-delivery
// @access  Private
const confirmOrderDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findOne({
        _id: req.params.id,
        user: req.user._id,
        isDeleted: false,
    }).populate("orderItems.food");

    if (!order)
    {
        return res.status(404).json({ message: "Order not found" });
    }

    if (!["onTheWay", "availableForPickup"].includes(order.status))
    {
        return res.status(400).json({ message: "Only orders that are on the way or ready for pickup can be confirmed as delivered." });
    }

    order.status = "delivered";
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const saved = await order.save();
    const updatedOrder = await Order.findById(saved._id)
        .populate("orderItems.food", "name price preparationTime image")
        .populate("user", "name email phone");

    try
    {
        await notifyOrderEvent({
            Notification,
            recipientRole: "admin",
            order: updatedOrder._id,
            message: `Customer confirmed delivery for order #${updatedOrder._id}.`,
            type: "status",
        });
    } catch (e)
    {
        console.error("Failed to create delivery confirmation notification", e);
    }

    res.json(updatedOrder);
});



// @desc    Archive an order (Admin)
// @route   PUT /api/orders/:id/archive
// @access  Private (Admin)
const deleteOrder = asyncHandler(async (req, res) => {
    const order = await Order.findOne({
        _id: req.params.id,
        isDeleted: false
    }).populate("orderItems.food");
    if (!order)
    {
        return res.status(404).json({ message: "Order not found" });
    }
    order.isDeleted = true;
    order.deletedAt = Date.now();
    await order.save();
    res.json({ message: "Order archived successfully" });
});


// cancel order (User)
// @route   PUT /api/orders/:id/cancel
// @access  Private (User)
const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findOne({
        _id: req.params.id,
        user: req.user._id,
        isDeleted: false
    }).populate("orderItems.food");
    if (!order)
    {
        return res.status(404).json({ message: "Order not found" });
    }

    const cancellableStatuses = ["pending", "preparing"];

    if (!cancellableStatuses.includes(order.status))
    {
        return res.status(400).json({ message: "Order cannot be cancelled" });
    }
    if (order.isPaid)
    {
        return res.status(400).json({ message: "Paid order cannot be cancelled" });
    }
    order.status = "cancelled";
    const saved = await order.save();
    const updatedOrder = await Order.findById(saved._id)
        .populate("orderItems.food", "name price preparationTime image")
        .populate("user", "name email phone");
    try
    {
        await notifyOrderEvent({
            Notification,
            recipientUser: updatedOrder.user._id,
            order: updatedOrder._id,
            message: `Your order #${updatedOrder._id} was cancelled`,
            type: "status",
        });
    } catch (e)
    {
        console.error("Failed to create notification", e);
    }
    res.json(updatedOrder);
});

// add comment to order (customer)
const addOrderComment = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const { message, type } = req.body;
    if (!message || !String(message).trim()) return res.status(400).json({ message: "Message required" });

    const comment = {
        user: req.user._id,
        authorRole: req.user.role === "admin" ? "admin" : "customer",
        message: String(message).trim(),
        type: type || "comment",
        createdAt: Date.now(),
        replies: [],
    };

    order.comments = order.comments || [];
    order.comments.push(comment);
    const saved = await order.save();

    const populated = await Order.findById(saved._id)
        .populate("orderItems.food", "name price preparationTime image")
        .populate("user", "name email phone")
        .populate("comments.user", "name email")
        .populate("comments.replies.user", "name email");

    try
    {
        await notifyOrderEvent({
            Notification,
            recipientRole: "admin",
            order: populated._id,
            message: `New comment on order #${populated._id}: ${comment.message}`,
            type: "comment",
        });
    } catch (e)
    {
        console.error("Failed to create notification", e);
    }

    res.status(201).json(populated);
});

const addOrderCommentReply = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const comment = order.comments?.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const { message } = req.body;
    if (!message || !String(message).trim()) return res.status(400).json({ message: "Reply message required" });

    comment.replies = comment.replies || [];
    comment.replies.push({
        user: req.user._id,
        authorRole: req.user.role === "admin" ? "admin" : "customer",
        message: String(message).trim(),
        createdAt: Date.now(),
    });

    const saved = await order.save();
    const populated = await Order.findById(saved._id)
        .populate("orderItems.food", "name price preparationTime image")
        .populate("user", "name email phone")
        .populate("comments.user", "name email")
        .populate("comments.replies.user", "name email");

    try
    {
        await notifyOrderEvent({
            Notification,
            recipientUser: order.user,
            order: populated._id,
            message: `Admin replied to your comment on order #${populated._id}.`,
            type: "comment",
        });
    } catch (e)
    {
        console.error("Failed to create notification", e);
    }

    res.status(201).json(populated);
});


export { createOrder, getMyOrders, getOrderById, getOrders, updateOrderStatus, deleteOrder, cancelOrder, confirmOrderDelivered, addOrderComment, addOrderCommentReply };
