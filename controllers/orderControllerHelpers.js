import mongoose from "mongoose";

export const LAGOS_LGAS = [
    "agege",
    "ajeromi-ifelodun",
    "alimosho",
    "amuwo-odofin",
    "apapa",
    "badagry",
    "epe",
    "eti-osa",
    "ibeju-lekki",
    "ifako-ijaiye",
    "ikeja",
    "ikorodu",
    "kosofe",
    "lagos island",
    "lagos mainland",
    "mushin",
    "oshodi-isolo",
    "ojo",
    "surulere",
    "somolu",
    "ikoyi",
    "lekki",
];

export const sanitizeString = (value = "") => {
    if (!value) return "";
    let sanitized = String(value).trim();
    sanitized = sanitized.replace(/https?:\/\/\S+/gi, "");
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");
    sanitized = sanitized.replace(/[\u{1F300}-\u{1F9FF}]/gu, "");
    sanitized = sanitized.replace(/\s+/g, " ");
    return sanitized.slice(0, 200).trim();
};

export const isAllowedLagosCity = (city = "") => {
    const normalizedCity = String(city || "").toLowerCase().trim();
    if (!normalizedCity) return false;
    if (normalizedCity.includes("lagos")) return true;
    return LAGOS_LGAS.some((area) => normalizedCity === area || normalizedCity.includes(area));
};

export const validateOrderItems = (orderItems) => {
    for (const item of orderItems)
    {
        if (!mongoose.Types.ObjectId.isValid(item.food))
        {
            return `Invalid food ID: ${item.food}`;
        }

        if (!Number.isInteger(item.qty) || item.qty <= 0 || item.qty > 100)
        {
            return `Invalid quantity for item. Must be between 1 and 100`;
        }
    }

    return null;
};

export const getConfiguredDeliveryFee = async (Setting) => {
    let configuredDeliveryFee = 1000;

    try
    {
        const settings = await Setting.findOne();
        if (settings && typeof settings.deliveryFee === "number")
        {
            configuredDeliveryFee = settings.deliveryFee;
        }
    } catch (error)
    {
        // fallback to default delivery fee
    }

    return configuredDeliveryFee;
};

export const notifyOrderEvent = async ({
    Notification,
    recipientRole,
    recipientUser,
    order,
    message,
    type = "status",
}) => {
    const payload = {
        ...(recipientRole ? { recipientRole } : {}),
        ...(recipientUser ? { recipientUser } : {}),
        order,
        message,
        type,
    };

    await Notification.create(payload);
};
