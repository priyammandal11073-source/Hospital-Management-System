import Notification from "../models/Notification.js";

// GET /api/notifications
export const getMyNotifications = async (req, res) => {
  try {
    const isStaff = Boolean(req.user);
    const filter = isStaff
      ? { $or: [{ recipientType: "staff" }, { recipientType: "all" }, { user: req.user?._id }] }
      : { $or: [{ recipientType: "patient", patient: req.patient?.id }, { recipientType: "all" }] };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch notifications" });
  }
};

// PATCH /api/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    return res.status(200).json({ notification });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update notification" });
  }
};

// PATCH /api/notifications/read-all
export const markAllNotificationsRead = async (req, res) => {
  try {
    const isStaff = Boolean(req.user);
    const filter = isStaff
      ? { $or: [{ recipientType: "staff" }, { recipientType: "all" }, { user: req.user?._id }], isRead: false }
      : { $or: [{ recipientType: "patient", patient: req.patient?.id }, { recipientType: "all" }], isRead: false };

    await Notification.updateMany(filter, { isRead: true });

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to mark notifications as read" });
  }
};
