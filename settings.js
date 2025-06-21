
require('dotenv').config(); 
module.exports = {
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/zacxstore',

    ORKUT_QRIS_STATIC_CODE: process.env.ORKUT_QRIS_STATIC_CODE, 
    ORKUT_QRIS_FEE_PERCENTAGE: process.env.ORKUT_QRIS_FEE_PERCENTAGE || 0.7, // Fee dalam persen
    ORKUT_QRIS_FEE_PERCENTAGE_FOR_DEPOSIT: process.env.ORKUT_QRIS_FEE_PERCENTAGE_FOR_DEPOSIT,
    ORKUT_QRIS_FEE_BY_CUSTOMER_DEPOSIT: process.env.ORKUT_QRIS_FEE_BY_CUSTOMER_DEPOSIT === 'true',
    ORKUT_QRIS_EXPIRY_MINUTES: process.env.ORKUT_QRIS_EXPIRY_MINUTES || 15,
    OKECONNECT_MERCHANT_ID: process.env.OKECONNECT_MERCHANT_ID, 
    OKECONNECT_API_KEY: process.env.OKECONNECT_API_KEY,     
};