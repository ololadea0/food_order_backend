import Food from "../models/foodModel.js";

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
    const image = req.body.image?.trim();
    const category = req.body.category?.trim();
    const preparationTime = Number(req.body.preparationTime);
    const { price, available } = req.body;
    try
    {
        const missingFields = [];

        if (!name) missingFields.push("name");
        if (!description) missingFields.push("description");
        if (price === undefined || price === null || price === "") missingFields.push("price");
        if (!image) missingFields.push("image");
        if (!category) missingFields.push("category");
        if (!req.body.preparationTime) missingFields.push("preparationTime");

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

        if (Number.isNaN(preparationTime) || preparationTime <= 0)
        {
            return res.status(400).json({ message: "Preparation time must be a valid number" });
        }

        const createdFood = await Food.create({
            name,
            description,
            price: numericPrice,
            image,
            category,
            preparationTime,
            available: available !== undefined ? available : true,
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
    const name = req.body.name?.trim();
    const description = req.body.description?.trim();
    const image = req.body.image?.trim();
    const category = req.body.category?.trim();
    const preparationTime = req.body.preparationTime;
    const { price, available } = req.body;
    try
    {
        const food = await Food.findById(req.params.id);
        if (!food)
        {
            return res.status(404).json({ message: "Food item not found" });
        }

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
            const numericPreparationTime = Number(preparationTime);
            if (Number.isNaN(numericPreparationTime) || numericPreparationTime <= 0)
            {
                return res.status(400).json({ message: "Preparation time must be a valid number" });
            }
            food.preparationTime = numericPreparationTime;
        }

        food.name = name || food.name;
        food.description = description || food.description;
        food.image = image || food.image;
        food.category = category || food.category;
        food.available = available !== undefined ? available : food.available;

        const updatedFood = await food.save();
        res.json(updatedFood);
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
