import { Router } from "express";
import { getSettings, updateSettings, updateDeliveryFee } from "../controllers/settingController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getSettings);
router.put("/", protect, adminOnly, updateSettings);
router.put("/delivery-fee", protect, adminOnly, updateDeliveryFee);

export default router;
