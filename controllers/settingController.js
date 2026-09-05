import asyncHandler from "express-async-handler";
import Setting from "../models/settingModel.js";

// @desc    Get application settings
// @route   GET /api/settings
// @access  Public
const getSettings = asyncHandler(async (req, res) => {
    let settings = await Setting.findOne();

    if (!settings)
    {
        // create default settings doc
        settings = await Setting.create({});
    }

    res.json(settings);
});

// @desc    Update delivery fee
// @route   PUT /api/settings/delivery-fee
// @access  Private (Admin)
const updateDeliveryFee = asyncHandler(async (req, res) => {
    const { deliveryFee } = req.body;

    if (typeof deliveryFee !== "number" || Number.isNaN(deliveryFee) || deliveryFee < 0)
    {
        return res.status(400).json({ message: "Invalid deliveryFee value" });
    }

    let settings = await Setting.findOne();

    if (!settings)
    {
        settings = await Setting.create({ deliveryFee });
    } else
    {
        settings.deliveryFee = deliveryFee;
        await settings.save();
    }

    res.json(settings);
});

export { getSettings, updateDeliveryFee };
