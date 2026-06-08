import mongoose from "mongoose";

const foodSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        preparationTime: {
            type: Number,
            required: true
        },

        available: {
            type: Boolean,
            default: true
        }
    }, {
    timestamps: true
}
);
const Food = mongoose.model("Food", foodSchema);
export default Food;
