import mongoose from "mongoose";

const settingSchema = mongoose.Schema(
    {
        deliveryFee: {
            type: Number,
            required: true,
            default: 1500,
        },
        restaurantName: {
            type: String,
            default: "NaijaBite",
        },
        contactEmail: {
            type: String,
            default: "hello@naijabite.com",
        },
        contactPhone: {
            type: String,
            default: "+234 800 624 2423",
        },
        address: {
            type: String,
            default: "Lagos, Nigeria",
        },
        footerDescription: {
            type: String,
            default: "Premium food delivery from the best restaurants in your city — fast, reliable, delicious.",
        },
    },
    {
        timestamps: true,
    }
);

const Setting = mongoose.model("Setting", settingSchema);
export default Setting;
