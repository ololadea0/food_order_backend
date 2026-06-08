import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },

    orderItems: [
        {
            food: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "Food",
            },
            qty: {
                type: Number,
                required: true,
            },
            // Store the item price at checkout time so old orders keep their original totals
            // even if the menu price changes later.
            price: {
                type: Number,
                required: true,
            },
        },
    ],
    orderType: {
        type: String,
        enum: ["delivery", "pickup"],
        default: "delivery",
    },

    deliveryAddress: {
        address: { type: String, required: function () { return this.orderType === "delivery"; } },
        city: { type: String, required: function () { return this.orderType === "delivery"; } },
        state: { type: String, required: function () { return this.orderType === "delivery"; } },
        phone: { type: String, required: function () { return this.orderType === "delivery"; } },
    },



    paymentResult: {
        id: String,
        reference: String,
        status: String,
        update_time: String,
        email: String,
    },

    status: {
        type: String,
        enum: ["pending", "onTheWay", "availableForPickup", "preparing", "delivered", "cancelled"],
        default: "pending",
    },

    deliveryFee: {
        type: Number,
        required: true,
        default: 0,
    },

    totalPrice: {
        type: Number,
        required: true,
        default: 0,
    },

    isPaid: {
        type: Boolean,
        default: false,
    },

    paidAt: Date,

    isDelivered: {
        type: Boolean,
        default: false,
    },

    deliveredAt: Date,
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: Date,
}, {
    timestamps: true,
});
const Order = mongoose.model("Order", orderSchema);
export default Order;
