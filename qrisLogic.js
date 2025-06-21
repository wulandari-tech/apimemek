const axios = require('axios');
const FormData = require('form-data');
const QRCode = require('qrcode');
const { Readable } = require('stream');

function convertCRC16(str) {
    let crc = 0xFFFF;
    const strlen = str.length;
    for (let c = 0; c < strlen; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    let hex = crc & 0xFFFF;
    hex = ("000" + hex.toString(16).toUpperCase()).slice(-4);
    return hex;
}

function generateOrkutTransactionId(prefix = "QRIS") {
    const timestamp = Date.now().toString().slice(-5);
    const randomString = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}${timestamp}${randomString}`;
}

function generateOrkutExpirationTime(minutes = parseInt(process.env.ORKUT_QRIS_EXPIRY_MINUTES) || 15) {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + minutes);
    return expirationTime;
}

async function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

async function uploadQrToCatbox(buffer) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        const stream = await bufferToStream(buffer);
        form.append('fileToUpload', stream, {
            filename: `qr_orkut_${Date.now()}.png`,
            contentType: 'image/png'
        });
        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: { ...form.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 15000
        });
        if (!response.data || typeof response.data !== 'string' || !response.data.startsWith('http')) {
            console.error("Catbox upload failed, response:", response.data);
            throw new Error('Gagal mengunggah QR ke Catbox.');
        }
        return response.data;
    } catch (error) {
        console.error("Error uploading to Catbox:", error.message);
        throw error;
    }
}

async function createDynamicOrkutQris(originalAmount, transactionName = "Pembayaran") {
    console.log(`qrisLogic: createDynamicOrkutQris - Env Static Code: ${process.env.ORKUT_QRIS_STATIC_CODE ? "OK" : "MISSING"}`);
    let orkutReffId, amountToPayWithFeeValue, parsedAmountValue, calculatedFeeAmountValue, qrImageUrlValue, finalQrisStringValue, expirationTimeValue;

    try {
        const staticQrisBase = process.env.ORKUT_QRIS_STATIC_CODE;
        const feePercentage = parseFloat(process.env.ORKUT_QRIS_FEE_PERCENTAGE_FOR_DEPOSIT || process.env.ORKUT_QRIS_FEE_PERCENTAGE || 0.7);
        const feeIsByCustomer = process.env.ORKUT_QRIS_FEE_BY_CUSTOMER_DEPOSIT === 'true';

        if (!staticQrisBase) throw new Error('ORKUT_QRIS_STATIC_CODE diperlukan.');
        
        parsedAmountValue = parseInt(originalAmount);
        if (isNaN(parsedAmountValue) || parsedAmountValue <= 0) throw new Error('Jumlah tidak valid.');
        
        amountToPayWithFeeValue = parsedAmountValue;
        calculatedFeeAmountValue = 0;
        
        if (feeIsByCustomer && feePercentage > 0) {
            calculatedFeeAmountValue = Math.ceil(parsedAmountValue * (feePercentage / 100));
            amountToPayWithFeeValue = parsedAmountValue + calculatedFeeAmountValue; 
        } else if (!feeIsByCustomer && feePercentage > 0) {
            calculatedFeeAmountValue = Math.ceil(parsedAmountValue * (feePercentage / 100));
        }

        let baseQrString = staticQrisBase;
        if (baseQrString.length > 12 && baseQrString.substring(6, 12) === "010211") {
             baseQrString = baseQrString.substring(0, 6) + "010212" + baseQrString.substring(12);
        }
        
        const countryCodeTag = "5802ID";
        const indexOfCountryCode = baseQrString.indexOf(countryCodeTag);
        if (indexOfCountryCode === -1) throw new Error("Format kode QRIS dasar tidak valid.");
        
        const part1 = baseQrString.substring(0, indexOfCountryCode);
        const part2 = baseQrString.substring(indexOfCountryCode);
        
        const amountStr = amountToPayWithFeeValue.toString();
        const amountLength = ("0" + amountStr.length).slice(-2);
        const transactionAmountField = "54" + amountLength + amountStr;
        
        const qrisStringToGenerateCRC = part1 + transactionAmountField + part2;
        const newCRC = convertCRC16(qrisStringToGenerateCRC);
        finalQrisStringValue = qrisStringToGenerateCRC + newCRC;
        
        const buffer = await QRCode.toBuffer(finalQrisStringValue, {
            errorCorrectionLevel: 'M', type: 'png', margin: 2, width: 300,
            color: { dark: "#000000", light: "#FFFFFF" }
        });
        
        qrImageUrlValue = await uploadQrToCatbox(buffer);
        orkutReffId = generateOrkutTransactionId("ORD");
        expirationTimeValue = generateOrkutExpirationTime();

        return {
            success: true, 
            orkutReffId: orkutReffId, 
            amountToPayWithFee: amountToPayWithFeeValue, 
            originalAmount: parsedAmountValue,
            feeAmount: calculatedFeeAmountValue, 
            qrImageUrl: qrImageUrlValue, 
            qrString: finalQrisStringValue,
            expiredAt: expirationTimeValue, 
            paymentMethod: 'ORKUT_QRIS', 
            message: 'QRIS berhasil dibuat.'
        };
    } catch (error) {
        console.error("qrisLogic: createDynamicOrkutQris - Error:", error.message, error.stack);
        // Pastikan semua field yang mungkin diakses oleh pemanggil ada, meskipun dengan nilai default/null jika error
        return { 
            success: false, 
            message: error.message || 'Gagal membuat QRIS Orkut.',
            orkutReffId: null, // atau undefined
            amountToPayWithFee: originalAmount, // Kembalikan originalAmount jika perhitungan gagal
            originalAmount: originalAmount,
            feeAmount: 0,
            qrImageUrl: null,
            qrString: null,
            expiredAt: null
        };
    }
}

async function checkOrkutQrisPaymentStatus(orderReffId, amountExpected, lastCheckedTimestamp) {
    console.log(`qrisLogic: checkOrkutQrisPaymentStatus - Env OkeConnect: MID ${process.env.OKECONNECT_MERCHANT_ID ? "OK" : "MISSING"}, Key ${process.env.OKECONNECT_API_KEY ? "OK" : "MISSING"}`);
    try {
        const merchantId = process.env.OKECONNECT_MERCHANT_ID; 
        const apiKey = process.env.OKECONNECT_API_KEY; 

        if (!merchantId || !apiKey) return { success: false, isPaid: false, message: 'Konfigurasi OkeConnect tidak lengkap.' };
        
        const lookbackMinutes = 30; 
        const thirtyMinutesAgo = new Date(Date.now() - lookbackMinutes * 60 * 1000);
        const checkFromDate = lastCheckedTimestamp ? new Date(Math.max(lastCheckedTimestamp, thirtyMinutesAgo.getTime())) : thirtyMinutesAgo;
        const dateFromParam = checkFromDate.toISOString().split('T')[0];

        const apiUrl = `https://gateway.okeconnect.com/api/mutasi/qris/${merchantId}/${apiKey}?date_from=${dateFromParam}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });

        if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
            const transactions = response.data.data;
            const searchReffIdPart = orderReffId.toUpperCase().slice(-8); 

            const matchedTx = transactions.find(tx => {
                const txAmount = parseInt(tx.amount);
                const noteIncludesReff = tx.note && tx.note.toUpperCase().includes(searchReffIdPart);
                return txAmount === amountExpected && noteIncludesReff;
            });

            if (matchedTx) return { success: true, isPaid: true, transaction: matchedTx, message: 'Pembayaran ditemukan.' };
            return { success: true, isPaid: false, raw_data: transactions, message: 'Pembayaran belum ditemukan dalam mutasi terbaru.' };
        }
        return { success: false, isPaid: false, message: response.data.message || 'Gagal mengambil data mutasi dari OkeConnect.' };
    } catch (error) {
        console.error('qrisLogic: checkOrkutQrisPaymentStatus - Error:', error.response ? JSON.stringify(error.response.data) : error.message);
        return { success: false, isPaid: false, message: error.message || 'Gagal menghubungi OkeConnect.' };
    }
}

module.exports = { createDynamicOrkutQris, checkOrkutQrisPaymentStatus };