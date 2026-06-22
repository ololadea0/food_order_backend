import { Router } from "express";
import upload from "../middleware/uploadMiddleware.js";
import cloudinary from "../config/cloudinary.js";

const uploadRouter = Router();

uploadRouter.post("/upload", (req, res) => {
    upload.single("image")(req, res, async (error) => {
        try
        {
            if (error)
            {
                return res.status(500).json({
                    message: error.message || "Image upload failed",
                });
            }

            if (!req.file)
            {
                return res.status(400).json({
                    message: "No file uploaded",
                });
            }

            const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

            const result = await cloudinary.uploader.upload(
                base64String,
                {
                    folder: "food_app",
                }
            );

            return res.status(200).json({
                imageUrl: result.secure_url,
            });
        }
        catch (err)
        {
            console.error(err);

            return res.status(500).json({
                message: "Cloudinary upload failed",
                error: err.message,
            });
        }
    });
});

export default uploadRouter;