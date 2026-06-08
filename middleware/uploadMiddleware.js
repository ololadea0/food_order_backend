import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import storagePkg from "multer-storage-cloudinary";

const storage = storagePkg({
    cloudinary,
    params: {
        folder: "food_app",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
});

const upload = multer({ storage });

export default upload;
