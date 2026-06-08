import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });


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
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
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
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
            role: user.role
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

        user.deliveryAddress = {
            address: deliveryAddress.address?.trim() || req.body.address?.trim() || user.deliveryAddress?.address,
            city: deliveryAddress.city?.trim() || req.body.city?.trim() || user.deliveryAddress?.city,
            phone: deliveryAddress.phone?.trim() || req.body.phone?.trim() || user.deliveryAddress?.phone,
        };
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


export { registerUser, authUser, getUserProfile, updateUserProfile, changeUserPassword, getUsers };
