import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer"))
    {
        try
        {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user)
            {
                res.status(401);
                throw new Error("Not authorized, user not found");
            }

            next();
        } catch (error)
        {
            res.status(401);
            return next(new Error("Not authorized, token failed"));
        }
    } else
    {
        res.status(401);
        return next(new Error("Not authorized, no token"));
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin")
    {
        next();
    } else
    {
        res.status(401);
        next(new Error("Not authorized, admin only"));
    }
};


export { protect, adminOnly };
