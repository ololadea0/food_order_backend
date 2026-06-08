import { Router } from "express";
import upload from "../middleware/uploadMiddleware.js";

const uploadRouter = Router();

uploadRouter.post("/upload", (req, res) => {
    upload.single("image")(req, res, (error) => {
        if (error)
        {
            return res.status(500).json({
                message: error.message || "Image upload failed"
            });
        }

        if (!req.file)
        {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const imageUrl = req.file.path || req.file.secure_url || req.file.url;

        if (!imageUrl)
        {
            return res.status(500).json({
                message: "Upload succeeded but no image URL was returned",
                file: req.file,
            });
        }

        res.status(200).json({ imageUrl });
    });
});

export default uploadRouter;
