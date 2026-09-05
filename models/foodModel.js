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
        popular: {
            type: Boolean,
            default: false,
        },
        category: {
            type: String,
            required: true,
            default: "Fast Food"
        },
        preparationTime: {
            type: Number,
            default: 0
        },

        available: {
            type: Boolean,
            default: true
        },
        ingredients: {
            type: [String],
            default: [],
        },
        additionalInfo: {
            type: String,
            default: ""
        }
    }, {
    timestamps: true
}
);
const Food = mongoose.model("Food", foodSchema);
export default Food;
