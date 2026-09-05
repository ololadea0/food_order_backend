import { Router } from "express";
import { getFoods, createFood, updateFood, deleteFood, getFoodById } from "../controllers/foodController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const foodRouter = Router();
foodRouter.get("/", getFoods);
foodRouter.get("/:id", getFoodById);


// accept multipart/form-data with optional `image` file
foodRouter.post("/", protect, adminOnly, upload.single("image"), createFood);
foodRouter.put("/:id", protect, adminOnly, upload.single("image"), updateFood);
foodRouter.delete("/:id", protect, adminOnly, deleteFood);

export default foodRouter;