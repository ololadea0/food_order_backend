import { Router, raw } from "express";
import { initializePaymentController, verifyPaymentController, payStackWebHook } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";


const paymentRouter = Router();

paymentRouter.post("/initialize", protect, initializePaymentController);
paymentRouter.post("/verify", protect, verifyPaymentController);
paymentRouter.post("/webhook", raw({ type: "application/json" }), payStackWebHook);

export default paymentRouter;
