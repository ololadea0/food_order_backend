import Order from "../models/orderModel.js";
import asyncHandler from "express-async-handler";
import Food from "../models/foodModel.js";
import mongoose from "mongoose";


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
        if (!deliveryAddress?.address || !deliveryAddress?.city || !deliveryAddress?.state || !deliveryAddress?.phone)
        {
            return res.status(400).json({ message: "Delivery address is required" });
        }
    }

    let orderDeliveryFee = orderType === "delivery" ? 1000 : 0;

    // ✅ Validate IDs first
    for (const item of orderItems)
    {
        if (!mongoose.Types.ObjectId.isValid(item.food))
        {
            return res.status(400).json({ message: `Invalid food ID: ${item.food}` });
        }

        if (!Number.isInteger(item.qty) || item.qty <= 0 || item.qty > 100)
        {
            return res.status(400).json({ message: `Invalid quantity for item. Must be between 1 and 100` });
        }
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
    res.status(201).json(createdOrder);
});

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private 
const getMyOrders = asyncHandler(async (req, res) => {

    const orders = await Order.find({ user: req.user._id, isDeleted: false }).sort({ createdAt: -1 });
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

    const orders = await Order.find({ isDeleted: false }).populate("user", "name email").sort({ createdAt: -1 });

    res.json(orders);

});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {

    const allowedStatuses = ["pending", "onTheWay", "availableForPickup", "preparing", "delivered", "cancelled"];

    const { status } = req.body;

    if (!allowedStatuses.includes(status))
    {
        return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findOne({
        _id: req.params.id,
        isDeleted: false
    }).populate("orderItems.food");

    if (!order)
    {
        return res.status(404).json({ message: "Order not found" });
    }

    if (status === "delivered" && !order.isPaid)
    {
        return res.status(400).json({ message: "Cannot mark as delivered if not paid" });
    }

    order.status = status;

    // Handle delivery logic ONLY
    if (status === "delivered")
    {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
    } else
    {
        order.isDelivered = false;
        order.deliveredAt = null;
    }

    const updatedOrder = await order.save();

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
    const updatedOrder = await order.save();
    res.json(updatedOrder);
});


export { createOrder, getMyOrders, getOrderById, getOrders, updateOrderStatus, deleteOrder, cancelOrder };
