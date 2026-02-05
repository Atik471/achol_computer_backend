import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BKASH_BASE_URL = process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
const BKASH_USERNAME = process.env.BKASH_USERNAME;
const BKASH_PASSWORD = process.env.BKASH_PASSWORD;
const BKASH_APP_KEY = process.env.BKASH_APP_KEY;
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET;

let authToken = null;
let tokenExpiry = null;

/**
 * Get bKash authentication token
 * @returns {Promise<string>} Auth token
 */
export const getBkashToken = async () => {
    // Return cached token if still valid
    if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
        return authToken;
    }

    try {
        const response = await axios.post(
            `${BKASH_BASE_URL}/tokenized/checkout/token/grant`,
            {
                app_key: BKASH_APP_KEY,
                app_secret: BKASH_APP_SECRET
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    username: BKASH_USERNAME,
                    password: BKASH_PASSWORD
                }
            }
        );

        if (response.data && response.data.id_token) {
            authToken = response.data.id_token;
            // Token typically expires in 1 hour, cache for 55 minutes
            tokenExpiry = Date.now() + (55 * 60 * 1000);
            return authToken;
        }

        throw new Error("Failed to get bKash token");
    } catch (error) {
        console.error("bKash token error:", error.response?.data || error.message);
        throw new Error(`Failed to authenticate with bKash: ${error.message}`);
    }
};

/**
 * Create bKash payment
 * @param {number} amount - Payment amount
 * @param {string} orderId - Order ID
 * @param {string} callbackURL - Callback URL after payment
 * @returns {Promise<object>} Payment creation response
 */
export const createBkashPayment = async (amount, orderId, callbackURL) => {
    try {
        const token = await getBkashToken();

        const response = await axios.post(
            `${BKASH_BASE_URL}/tokenized/checkout/create`,
            {
                mode: "0011", // Wallet payment
                payerReference: orderId,
                callbackURL: callbackURL,
                amount: amount.toFixed(2),
                currency: "BDT",
                intent: "sale",
                merchantInvoiceNumber: `INV${orderId}`
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                    "X-APP-Key": BKASH_APP_KEY
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error("bKash payment creation error:", error.response?.data || error.message);
        throw new Error(`Failed to create bKash payment: ${error.message}`);
    }
};

/**
 * Execute bKash payment
 * @param {string} paymentID - Payment ID from create payment
 * @returns {Promise<object>} Execution response
 */
export const executeBkashPayment = async (paymentID) => {
    try {
        const token = await getBkashToken();

        const response = await axios.post(
            `${BKASH_BASE_URL}/tokenized/checkout/execute`,
            {
                paymentID
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                    "X-APP-Key": BKASH_APP_KEY
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error("bKash payment execution error:", error.response?.data || error.message);
        throw new Error(`Failed to execute bKash payment: ${error.message}`);
    }
};

/**
 * Query bKash payment status
 * @param {string} paymentID - Payment ID
 * @returns {Promise<object>} Payment status
 */
export const queryBkashPayment = async (paymentID) => {
    try {
        const token = await getBkashToken();

        const response = await axios.post(
            `${BKASH_BASE_URL}/tokenized/checkout/payment/status`,
            {
                paymentID
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                    "X-APP-Key": BKASH_APP_KEY
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error("bKash payment query error:", error.response?.data || error.message);
        throw new Error(`Failed to query bKash payment: ${error.message}`);
    }
};

/**
 * Refund bKash payment
 * @param {string} paymentID - Payment ID
 * @param {number} amount - Refund amount
 * @param {string} trxID - Transaction ID
 * @returns {Promise<object>} Refund response
 */
export const refundBkashPayment = async (paymentID, amount, trxID) => {
    try {
        const token = await getBkashToken();

        const response = await axios.post(
            `${BKASH_BASE_URL}/tokenized/checkout/payment/refund`,
            {
                paymentID,
                amount: amount.toFixed(2),
                trxID,
                sku: "payment",
                reason: "Customer requested refund"
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                    "X-APP-Key": BKASH_APP_KEY
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error("bKash refund error:", error.response?.data || error.message);
        throw new Error(`Failed to refund bKash payment: ${error.message}`);
    }
};

export default {
    getBkashToken,
    createBkashPayment,
    executeBkashPayment,
    queryBkashPayment,
    refundBkashPayment
};
