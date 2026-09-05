import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Basic server-side sanitization and Lagos LGA whitelist
const LAGOS_LGAS = [
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

const sanitizeString = (v = "") => {
    if (!v) return "";
    let s = String(v).trim();
    // remove urls
    s = s.replace(/https?:\/\/\S+/gi, "");
    // remove control chars
    s = s.replace(/[\x00-\x1F\x7F]/g, "");
    // remove many emoji ranges
    s = s.replace(/[\u{1F300}-\u{1F9FF}]/gu, "");
    // collapse whitespace
    s = s.replace(/\s+/g, " ");
    return s.slice(0, 200).trim();
};

const isAllowedLagosCity = (city = "") => {
    const c = String(city || "").toLowerCase().trim();
    if (!c) return false;
    if (c.includes("lagos")) return true;
    return LAGOS_LGAS.some((g) => c === g || c.includes(g));
};

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

const setAuthCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
    });
};


// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public

const registerUser = async (req, res, next) => {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password)
    {
        res.status(400);
        throw new Error("Name, email, and password are required");
    }

    const userExists = await User.findOne({ email });
    if (userExists)
    {
        res.status(400);
        throw new Error("User already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (user)
    {
        const token = generateToken(user._id);
        setAuthCookie(res, token);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            deliveryAddress: user.deliveryAddress,
        });
    } else
    {
        res.status(400);
        throw new Error("Invalid user data");
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public  

const authUser = async (req, res, next) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password)
    {
        res.status(400);
        throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password)))
    {
        const token = generateToken(user._id);
        setAuthCookie(res, token);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            deliveryAddress: user.deliveryAddress,
        });
    } else
    {
        res.status(400);
        throw new Error("Invalid email or password");
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private

const getUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (user)
    {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            deliveryAddress: user.deliveryAddress

        });
    } else
    {
        res.status(404);
        throw new Error("User not found");
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (user)
    {
        const deliveryAddress = req.body.deliveryAddress || {};
        const nextName = req.body.name?.trim();
        const nextEmail = req.body.email?.trim().toLowerCase();

        if (nextEmail && nextEmail !== user.email)
        {
            const emailOwner = await User.findOne({ email: nextEmail });

            if (emailOwner)
            {
                res.status(400);
                throw new Error("Email already exists");
            }
        }

        user.name = nextName || user.name;
        user.email = nextEmail || user.email;

        const nextDeliveryAddress = {
            address: deliveryAddress.address !== undefined
                ? sanitizeString(deliveryAddress.address)
                : sanitizeString(req.body.address ?? ""),
            landmark: deliveryAddress.landmark !== undefined
                ? sanitizeString(deliveryAddress.landmark)
                : sanitizeString(req.body.landmark ?? ""),
            city: deliveryAddress.city !== undefined
                ? sanitizeString(deliveryAddress.city)
                : sanitizeString(req.body.city ?? ""),
            phone: deliveryAddress.phone !== undefined
                ? sanitizeString(deliveryAddress.phone)
                : sanitizeString(req.body.phone ?? ""),
        };

        user.deliveryAddress = nextDeliveryAddress;
        // Enforce Lagos-only addresses using explicit LGA whitelist
        if (user.deliveryAddress.address && !isAllowedLagosCity(user.deliveryAddress.city))
        {
            res.status(400);
            throw new Error("Delivery address must be in Lagos");
        }
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            deliveryAddress: updatedUser.deliveryAddress

        });
    } else
    {
        res.status(404);
        throw new Error("User not found");
    }
};

// @desc    Change User Password
// @route   PUT /api/users/password
// @access  Private

const changeUserPassword = async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
    {
        res.status(400);
        throw new Error("Current password and new password are required");
    }

    if (newPassword.length < 6)
    {
        res.status(400);
        throw new Error("New password must be at least 6 characters");
    }

    const user = await User.findById(req.user._id);

    if (!user)
    {
        res.status(404);
        throw new Error("User not found");
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch)
    {
        res.status(400);
        throw new Error("Current password is incorrect");
    }

    user.password = newPassword; // triggers pre-save hook
    await user.save();

    res.json({ message: "Password updated successfully" });
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
};

const logoutUser = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });

    res.status(200).json({ message: "Logged out successfully" });
};


export { registerUser, authUser, getUserProfile, updateUserProfile, changeUserPassword, getUsers, logoutUser };
