import jwt from "jsonwebtoken";

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
    "ikorodu north",
    "ikorodu south",
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

    return LAGOS_LGAS.some(
        (area) => normalizedCity === area || normalizedCity.includes(area),
    );
};

export const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

export const setAuthCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // For cross-site requests (frontend on Netlify, backend on Render)
        // cookies must be SameSite='none' and Secure in production.
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
    });
};

export const serializeUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    deliveryAddress: user.deliveryAddress,
});
