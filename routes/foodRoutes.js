import { Router } from "express";
import { getFoods, createFood, updateFood, deleteFood, getFoodById } from "../controllers/foodController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const foodRouter = Router();
foodRouter.get("/", getFoods);
foodRouter.get("/:id", getFoodById);


foodRouter.post("/", protect, adminOnly, createFood);
foodRouter.put("/:id", protect, adminOnly, updateFood);
foodRouter.delete("/:id", protect, adminOnly, deleteFood);

export default foodRouter;