import { Router } from "express";
import { getSettings, updateDeliveryFee } from "../controllers/settingController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getSettings);
router.put("/delivery-fee", protect, adminOnly, updateDeliveryFee);

export default router;
