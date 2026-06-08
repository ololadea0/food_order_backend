import { Router } from "express";
import { registerUser, authUser, getUserProfile, updateUserProfile, changeUserPassword, getUsers } from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", authUser);
userRouter.get("/", protect, adminOnly, getUsers);
userRouter.get("/profile", protect, getUserProfile);
userRouter.put("/profile", protect, updateUserProfile);
userRouter.put("/password", protect, changeUserPassword);

export default userRouter;
