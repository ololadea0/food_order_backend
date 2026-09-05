import asyncHandler from "express-async-handler";
import { initializeTransaction, verifyTransaction } from "../services/paymentService.js";
import Order from "../models/orderModel.js";
import crypto from "crypto";


// @desc    Initialize payment
// @route   POST /api/payments/initialize
// @access  Private
const initializePaymentController = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId)
    {
        return res.status(400).json({ message: "Order ID is required" });
    }

    let order;
    try
    {
        order = await Order.findById(orderId).populate("user", "email");

    } catch (error)
    {
        console.error("Error fetching order:", error);
        return res.status(500).json({ message: "Failed to fetch order" });
    }

    //Ensure user exists in request (should be set by auth middleware)
    if (!req.user || !req.user._id)
    {
        return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if order exists and belongs to the authenticated user
    if (!order)
    {
        return res.status(404).json({ message: "Order not found" });
    }

    // Ensure the order belongs to the authenticated user
    if (order.user._id.toString() !== req.user._id.toString())
    {
        return res.status(403).json({ message: "Unauthorized to initialize payment for this order" });

    }

    // Prevent double payment initialization
    if (order.isPaid)
    {
        return res.status(400).json({ message: "Order is already paid" });
    }

    if (!order.user?.email)
    {
        return res.status(400).json({ message: "User email not found" });
    }

    // Initialize payment with Paystack
    try
    {
        const transaction = await initializeTransaction(
            order.user.email,
            order.totalPrice,
            order._id);

        res.json({
            message: "Payment initialized successfully",
            authorizationUrl: transaction.authorization_url,
            reference: transaction.reference,
        });
    } catch (error)
    {
        // Log detailed error for server logs and return a helpful message to the frontend
        console.error("Payment initialization error:", error.response?.data || error.message || error);
        const clientMsg = error.message || error.response?.data?.message || "Failed to initialize payment";
        res.status(500).json({ message: clientMsg });
    }

});


// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private

const verifyPaymentController = asyncHandler(async (req, res) => {
    const { reference } = req.body;

    try
    {
        const transaction = await verifyTransaction(reference);

        if (!transaction || transaction.status !== "success")
        {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        const orderId = transaction.metadata?.orderId;
        if (!orderId)
        {
            return res.status(400).json({ message: "Order ID not found in transaction metadata" });
        }

        const order = await Order.findById(orderId);

        if (!order)
        {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.isPaid)
        {
            return res.json({
                message: "Order payment had already been verified",
                orderId: order._id
            });
        }

        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: transaction.id,
            status: transaction.status,
            reference: transaction.reference,
        };

        await order.save();
        res.json({
            message: "Payment verified and order updated successfully",
            orderId: order._id
        });

    } catch (error)
    {
        console.error("Verify Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Failed to verify payment" });
    }
});

const payStackWebHook = asyncHandler(async (req, res) => {
    const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(payload)
        .digest("hex");
    if (hash !== req.headers["x-paystack-signature"])
    {
        return res.status(400).json({ message: "Invalid webhook signature" });
    }
    const event = Buffer.isBuffer(req.body)
        ? JSON.parse(req.body.toString("utf8"))
        : req.body;
    if (event.event === "charge.success")
    {
        const orderId = event.data.metadata.orderId;
        const order = await Order.findById(orderId);

        if (order && !order.isPaid)
        {
            order.isPaid = true;
            order.paidAt = Date.now();
            await order.save();
        }
    }
    return res.status(200).json({ received: true });
});


export { initializePaymentController, verifyPaymentController, payStackWebHook };
