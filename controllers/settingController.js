import asyncHandler from "express-async-handler";
import Setting from "../models/settingModel.js";

const defaultSettings = {
    deliveryFee: 1500,
    restaurantName: "NaijaBite",
    contactEmail: "hello@naijabite.com",
    contactPhone: "+234 800 624 2423",
    address: "Lagos, Nigeria",
    footerDescription: "Premium food delivery from the best restaurants in your city — fast, reliable, delicious.",
};

// @desc    Get application settings
// @route   GET /api/settings
// @access  Public
const getSettings = asyncHandler(async (req, res) => {
    let settings = await Setting.findOne();

    if (!settings)
    {
        settings = await Setting.create(defaultSettings);
    }

    res.json({
        ...defaultSettings,
        ...settings.toObject(),
    });
});

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private (Admin)
const updateSettings = asyncHandler(async (req, res) => {
    const {
        deliveryFee,
        restaurantName,
        contactEmail,
        contactPhone,
        address,
        footerDescription,
    } = req.body || {};

    let settings = await Setting.findOne();

    if (!settings)
    {
        settings = new Setting(defaultSettings);
    }

    if (deliveryFee !== undefined)
    {
        const feeValue = Number(deliveryFee);

        if (Number.isNaN(feeValue) || feeValue < 0)
        {
            return res.status(400).json({ message: "Invalid deliveryFee value" });
        }

        settings.deliveryFee = feeValue;
    }

    if (restaurantName !== undefined) settings.restaurantName = String(restaurantName).trim() || defaultSettings.restaurantName;
    if (contactEmail !== undefined) settings.contactEmail = String(contactEmail).trim() || defaultSettings.contactEmail;
    if (contactPhone !== undefined) settings.contactPhone = String(contactPhone).trim() || defaultSettings.contactPhone;
    if (address !== undefined) settings.address = String(address).trim() || defaultSettings.address;
    if (footerDescription !== undefined) settings.footerDescription = String(footerDescription).trim() || defaultSettings.footerDescription;

    await settings.save();

    res.json({
        ...defaultSettings,
        ...settings.toObject(),
    });
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
        settings = await Setting.create({ ...defaultSettings, deliveryFee });
    } else
    {
        settings.deliveryFee = deliveryFee;
        await settings.save();
    }

    res.json({
        ...defaultSettings,
        ...settings.toObject(),
    });
});

export { getSettings, updateSettings, updateDeliveryFee };
