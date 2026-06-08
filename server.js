import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import colors from "colors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import userRouter from "./routes/authRoute.js";
import foodRouter from "./routes/foodRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import paymentRouter from "./routes/paymentRoute.js";
import errorHandler from "./middleware/errorMiddleware.js";
import uploadRouter from "./routes/uploadRoutes.js";

dotenv.config();
await connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 5002;


const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    "http://localhost:5173",
].filter(Boolean);
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json({
    verify: (req, _res, buffer) => {
        if (req.originalUrl === "/api/payments/webhook")
        {
            req.rawBody = buffer;
        }
    },
}));
app.use(express.urlencoded({ extended: false }));

app.use("/api/users", userRouter);
app.use("/api/foods", foodRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/uploads", uploadRouter);

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
    });
});

if (process.env.NODE_ENV === "production")
{
    const frontendDistPath = path.resolve(__dirname, "../frontend/dist");

    app.use(express.static(frontendDistPath));
    app.get(/.*/, (_req, res) => {
        res.sendFile(path.join(frontendDistPath, "index.html"));
    });
}

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`.bgCyan.white);
});
