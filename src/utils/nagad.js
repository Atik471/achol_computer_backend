import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const NAGAD_BASE_URL = process.env.NAGAD_BASE_URL || "https://sandbox.mynagad.com:8071/remote-payment-gateway-1.0/api/dfs";
const NAGAD_MERCHANT_ID = process.env.NAGAD_MERCHANT_ID;
const NAGAD_MERCHANT_NUMBER = process.env.NAGAD_MERCHANT_NUMBER;
const NAGAD_PUBLIC_KEY = process.env.NAGAD_PUBLIC_KEY;
const NAGAD_PRIVATE_KEY = process.env.NAGAD_PRIVATE_KEY;

/**
 * Generate Nagad signature
 * @param {object} data - Data to sign
 * @returns {string} Signature
 */
const generateSignature = (data) => {
    const dataString = JSON.stringify(data);
    const sign = crypto.createSign("SHA256");
    sign.update(dataString);
    sign.end();
    return sign.sign(NAGAD_PRIVATE_KEY, "base64");
};

/**
 * Create Nagad payment
 * @param {number} amount - Payment amount
 * @param {string} orderId - Order ID
 * @param {string} callbackURL - Callback URL
 * @returns {Promise<object>} Payment creation response
 */
export const createNagadPayment = async (amount, orderId, callbackURL) => {
    try {
        const timestamp = Date.now().toString();
        const randomStr = crypto.randomBytes(20).toString("hex");

        // Initialize payment
        const initData = {
            merchantId: NAGAD_MERCHANT_ID,
            orderId: orderId,
            dateTime: timestamp,
            challenge: randomStr
        };

        const signature = generateSignature(initData);

        const initResponse = await axios.post(
            `${NAGAD_BASE_URL}/check-out/initialize/${NAGAD_MERCHANT_ID}/${orderId}`,
            initData,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-KM-Api-Version": "v-0.2.0",
                    "X-KM-IP-V4": "127.0.0.1",
                    "X-KM-Client-Type": "PC_WEB",
                    "X-KM-Signature": signature
                }
            }
        );

        if (!initResponse.data || !initResponse.data.sensitiveData) {
            throw new Error("Failed to initialize Nagad payment");
        }

        // Complete payment
        const completeData = {
            merchantId: NAGAD_MERCHANT_ID,
            orderId: orderId,
            currencyCode: "050", // BDT
            amount: amount.toFixed(2),
            challenge: initResponse.data.challenge,
            productDetails: {
                productName: "Order Payment",
                productPrice: amount.toFixed(2)
            },
            merchantCallbackURL: callbackURL
        };

        const completeSignature = generateSignature(completeData);

        const completeResponse = await axios.post(
            `${NAGAD_BASE_URL}/check-out/complete/${orderId}`,
            {
                ...completeData,
                sensitiveData: initResponse.data.sensitiveData
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-KM-Api-Version": "v-0.2.0",
                    "X-KM-IP-V4": "127.0.0.1",
                    "X-KM-Client-Type": "PC_WEB",
                    "X-KM-Signature": completeSignature
                }
            }
        );

        return completeResponse.data;
    } catch (error) {
        console.error("Nagad payment creation error:", error.response?.data || error.message);
        throw new Error(`Failed to create Nagad payment: ${error.message}`);
    }
};

/**
 * Verify Nagad payment
 * @param {string} paymentRefId - Payment reference ID from Nagad
 * @returns {Promise<object>} Payment verification response
 */
export const verifyNagadPayment = async (paymentRefId) => {
    try {
        const response = await axios.get(
            `${NAGAD_BASE_URL}/verify/payment/${paymentRefId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-KM-Api-Version": "v-0.2.0",
                    "X-KM-IP-V4": "127.0.0.1",
                    "X-KM-Client-Type": "PC_WEB"
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error("Nagad payment verification error:", error.response?.data || error.message);
        throw new Error(`Failed to verify Nagad payment: ${error.message}`);
    }
};

/**
 * Refund Nagad payment
 * @param {string} orderId - Original order ID
 * @param {string} paymentRefId - Payment reference ID
 * @param {number} amount - Refund amount
 * @returns {Promise<object>} Refund response
 */
export const refundNagadPayment = async (orderId, paymentRefId, amount) => {
    try {
        const refundData = {
            merchantId: NAGAD_MERCHANT_ID,
            orderId: orderId,
            paymentRefId: paymentRefId,
            amount: amount.toFixed(2),
            reason: "Customer requested refund"
        };

        const signature = generateSignature(refundData);

        const response = await axios.post(
            `${NAGAD_BASE_URL}/refund`,
            refundData,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-KM-Api-Version": "v-0.2.0",
                    "X-KM-IP-V4": "127.0.0.1",
                    "X-KM-Client-Type": "PC_WEB",
                    "X-KM-Signature": signature
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error("Nagad refund error:", error.response?.data || error.message);
        throw new Error(`Failed to refund Nagad payment: ${error.message}`);
    }
};

export default {
    createNagadPayment,
    verifyNagadPayment,
    refundNagadPayment
};
