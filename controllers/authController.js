import User from "../models/userModel.js";
import {
    sanitizeString,
    isAllowedLagosCity,
    generateToken,
    setAuthCookie,
    serializeUser,
} from "./authControllerHelpers.js";


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

        res.status(201).json(serializeUser(user));
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

        res.json(serializeUser(user));
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
        res.json(serializeUser(user));
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
        res.json(serializeUser(updatedUser));
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
