import mongoose from "mongoose";


const connectDB = async () => {
    try
    {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: "food_order_system"
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`.bgGreen.white);
    } catch (error)
    {
        console.error(`Error connecting to MongoDB: ${error.message}`.bgRed.white);
        process.exit(1);
    }
}

export default connectDB;