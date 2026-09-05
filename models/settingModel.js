import mongoose from "mongoose";

const settingSchema = mongoose.Schema(
    {
        deliveryFee: {
            type: Number,
            required: true,
            default: 1000,
        },
    },
    {
        timestamps: true,
    }
);

const Setting = mongoose.model("Setting", settingSchema);
export default Setting;
