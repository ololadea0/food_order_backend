import { v2 as cloudinaryV2 } from "cloudinary";

export function configureCloudinary() {
    // call this at runtime (after dotenv.config()) to ensure env vars are loaded
    cloudinaryV2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

export default cloudinaryV2;
