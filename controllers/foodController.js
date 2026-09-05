import Food from "../models/foodModel.js";
import cloudinary, { configureCloudinary } from "../config/cloudinary.js";

// @desc    Get all food items
// @route   GET /api/foods
// @access  Public  
const getFoods = async (req, res) => {
    try
    {
        const foods = await Food.find();
        res.json(foods);
    } catch (error)
    {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get a single food item by ID
// @route   GET /api/foods/:id
// @access  Public
const getFoodById = async (req, res) => {
    try
    {
        const food = await Food.findById(req.params.id);
        if (!food)
        {
            return res.status(404).json({ message: "Food item not found" });
        }
        res.json(food);
    } catch (error)
    {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Create a new food item
// @route   POST /api/foods/create
// @access  Private (Admin)
const createFood = async (req, res) => {
    const name = req.body.name?.trim();
    const description = req.body.description?.trim();
    const category = req.body.category?.trim();
    const { price, available } = req.body;
    const popular = req.body.popular === "true" || req.body.popular === true;
    let image = req.body.image?.trim();
    const isFastFood = category === "Fast Food";
    const preparationTime = isFastFood ? Number(req.body.preparationTime) : 0;
    try
    {
        const missingFields = [];

        if (!name) missingFields.push("name");
        if (!description) missingFields.push("description");
        if (price === undefined || price === null || price === "") missingFields.push("price");
        if (!image && !req.file) missingFields.push("image");
        if (!category) missingFields.push("category");
        if (isFastFood && !req.body.preparationTime) missingFields.push("preparationTime");

        if (missingFields.length > 0)
        {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(", ")}`
            });
        }

        const numericPrice = Number(price);

        if (Number.isNaN(numericPrice) || numericPrice < 0)
        {
            return res.status(400).json({ message: "Price must be a valid number" });
        }

        if (isFastFood && (Number.isNaN(preparationTime) || preparationTime <= 0))
        {
            return res.status(400).json({ message: "Preparation time must be a valid number" });
        }

        // If file uploaded, upload to cloudinary
        if (req.file && !image)
        {
            const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
            try
            {
                configureCloudinary();
                const result = await cloudinary.uploader.upload(base64String, { folder: "food_app" });
                image = result.secure_url;
            } catch (err)
            {
                console.error("Cloudinary upload failed", err);
                return res.status(500).json({ message: "Image upload failed" });
            }
        }

        // parse ingredients if provided
        const ingredients = Array.isArray(req.body.ingredients)
            ? req.body.ingredients.map((s) => String(s).trim()).filter(Boolean)
            : typeof req.body.ingredients === "string"
                ? req.body.ingredients.split(",").map((s) => s.trim()).filter(Boolean)
                : [];

        const createdFood = await Food.create({
            name,
            description,
            price: numericPrice,
            image,
            category: category || undefined,
            preparationTime,
            available: available !== undefined ? available : true,
            additionalInfo: req.body.additionalInfo?.trim() || "",
            ingredients,
            popular: Boolean(popular),
        });
        res.status(201).json(createdFood);
    } catch (error)
    {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a food item
// @route   PUT /api/foods/:id
// @access  Private (Admin)
const updateFood = async (req, res) => {
    try
    {
        const name = req.body.name?.trim();
        const description = req.body.description?.trim();
        let image = req.body.image?.trim();
        const category = req.body.category?.trim();
        const preparationTime = req.body.preparationTime;
        const additionalInfo = req.body.additionalInfo?.trim();
        const { price, available } = req.body;
        const popular = req.body.popular === "true" || req.body.popular === true;

        const food = await Food.findById(req.params.id);

        if (!food)
        {
            return res.status(404).json({ message: "Food item not found" });
        }

        const oldCategory = food.category;
        const newCategory = category || oldCategory;
        const isFastFood = newCategory === "Fast Food";

        if (price !== undefined)
        {
            const numericPrice = Number(price);
            if (Number.isNaN(numericPrice) || numericPrice < 0)
            {
                return res.status(400).json({ message: "Price must be a valid number" });
            }
            food.price = numericPrice;
        }

        if (preparationTime !== undefined)
        {
            if (isFastFood)
            {
                const numericPreparationTime = Number(preparationTime);
                if (Number.isNaN(numericPreparationTime) || numericPreparationTime <= 0)
                {
                    return res.status(400).json({ message: "Preparation time must be a valid number" });
                }
                food.preparationTime = numericPreparationTime;
            }
        }

        if (newCategory !== "Fast Food")
        {
            food.preparationTime = 0;
        }

        if (
            newCategory === "Fast Food" &&
            oldCategory !== "Fast Food" &&
            preparationTime === undefined &&
            !food.preparationTime
        )
        {
            return res.status(400).json({
                message: "Preparation time is required for Fast Food items",
            });
        }

        food.name = name || food.name;
        food.description = description || food.description;
        // If a new file is uploaded, replace image via cloudinary
        if (req.file && !image)
        {
            const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
            try
            {
                configureCloudinary();
                const result = await cloudinary.uploader.upload(base64String, { folder: "food_app" });
                image = result.secure_url;
            } catch (err)
            {
                console.error("Cloudinary upload failed", err);
                return res.status(500).json({ message: "Image upload failed" });
            }
        }

        food.image = image || food.image;
        if (popular !== undefined) food.popular = Boolean(popular);
        // parse and set ingredients if provided
        const ingredients = Array.isArray(req.body.ingredients)
            ? req.body.ingredients.map((s) => String(s).trim()).filter(Boolean)
            : typeof req.body.ingredients === "string"
                ? req.body.ingredients.split(",").map((s) => s.trim()).filter(Boolean)
                : undefined;
        if (ingredients !== undefined) food.ingredients = ingredients;
        food.category = newCategory;
        if (available !== undefined) food.available = available;
        food.additionalInfo = additionalInfo || food.additionalInfo;
        await food.save();

        res.status(200).json(food);

    } catch (error)
    {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a food item
// @route   DELETE /api/foods/:id
// @access  Private (Admin)
const deleteFood = async (req, res) => {
    try
    {
        const deletedFood = await Food.findByIdAndDelete(req.params.id);
        if (!deletedFood)
        {
            return res.status(404).json({ message: "Food item not found" });
        }
        res.json({ message: "Food item deleted", food: deletedFood });
    } catch (error)
    {
        res.status(500).json({ message: error.message });
    }
};


export { getFoods, getFoodById, createFood, updateFood, deleteFood };
