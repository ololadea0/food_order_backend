import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
    {
        recipientUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        recipientRole: {
            type: String, // e.g., 'admin' or 'user'
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        message: {
            type: String,
        },
        type: {
            type: String,
            enum: ["comment", "status", "system"],
            default: "system",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
