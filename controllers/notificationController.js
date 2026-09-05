import Notification from "../models/notificationModel.js";
import asyncHandler from "express-async-handler";

// GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
    const role = (req.user?.role || "user").toLowerCase();
    const notifications = await Notification.find({
        $or: [{ recipientUser: req.user._id }, { recipientRole: role }],
    })
        .sort({ createdAt: -1 })
        .limit(200);
    res.json(notifications);
});

// PUT /api/notifications/:id/read
const markNotificationRead = asyncHandler(async (req, res) => {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    if (String(notif.recipientUser) !== String(req.user._id) && notif.recipientRole !== req.user.role.toLowerCase())
    {
        return res.status(403).json({ message: "Not allowed" });
    }
    notif.isRead = true;
    await notif.save();
    res.json({ message: "Marked read" });
});

// PUT /api/notifications/read-all
const markAllNotificationsRead = asyncHandler(async (req, res) => {
    const role = (req.user?.role || "user").toLowerCase();
    await Notification.updateMany(
        { $or: [{ recipientUser: req.user._id }, { recipientRole: role }] },
        { $set: { isRead: true } },
    );
    res.json({ message: "All notifications marked read" });
});

export { getNotifications, markNotificationRead, markAllNotificationsRead };
