import mongoose from "mongoose";

const restaurantSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        }
    }, {
    timestamps: true
});
const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;
