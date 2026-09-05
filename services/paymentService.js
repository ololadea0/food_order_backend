import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

if (!PAYSTACK_SECRET_KEY)
{
    console.error("PAYSTACK_SECRET_KEY is not defined in environment variables");
    process.exit(1);
}


const getHeaders = () => ({
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
});



//Integrate with Paystack to initialize a transaction
const initializeTransaction = async (email, amount, orderId) => {
    try
    {
        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transaction/initialize`,
            {
                email,
                amount: amount * 100, // Paystack expects amount in kobo
                metadata: {
                    orderId,
                },
                // Keep the return URL environment-driven so local and hosted deployments
                // can share the same payment code path. Use the frontend's /payment/success
                // route which the app maps to the payment success handler.
                callback_url: `${FRONTEND_URL}/payment/success`,
            },
            { headers: getHeaders() }
        );
        return response.data.data; // Return the initialized transaction data
    } catch (error)
    {
        console.error("Error initializing transaction:", error.response?.data || error.message);
        // Surface Paystack's message where available for easier debugging on frontend.
        const msg = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to initialize transaction";
        const err = new Error(msg);
        err.original = error;
        throw err;
    }
};

// Integrate with Paystack to verify a transaction
const verifyTransaction = async (reference) => {
    try
    {
        const response = await axios.get(
            `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
            { headers: getHeaders() }
        );
        return response.data.data; // Return the verified transaction data
    } catch (error)
    {
        console.error("Paystack Error:", error.response?.data || error.message);
        throw new Error("Failed to verify transaction");
    }
};



export { initializeTransaction, verifyTransaction };
