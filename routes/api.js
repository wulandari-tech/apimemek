const express = require('express');
const router = express.Router();
const { createDynamicOrkutQris, checkOrkutQrisPaymentStatus } = require('../qrisLogic');
const Transaction = require('../models/transaction');

router.post('/create-qris', async (req, res) => {
    const { amount, productName, ffId, ffNickname } = req.body;

    if (!amount || !productName || !ffId) {
        console.error("Backend: /api/create-qris - Data tidak lengkap.", req.body);
        return res.status(400).json({ success: false, message: 'Data input tidak lengkap.' });
    }

    try {
        const qrisResult = await createDynamicOrkutQris(amount, `Pembayaran ${productName}`);
        console.log("Backend: /api/create-qris - Hasil qrisLogic:", qrisResult.success, qrisResult.orkutReffId);

        if (!qrisResult.success || !qrisResult.orkutReffId) {
            console.error("Backend: /api/create-qris - Gagal membuat QRIS dari qrisLogic:", qrisResult.message);
            return res.status(500).json({ success: false, message: qrisResult.message || 'Gagal internal saat membuat data QRIS.' });
        }

        const newTransaction = new Transaction({
            orkutReffId: qrisResult.orkutReffId,
            productName: productName,
            ffId: ffId,
            ffNickname: ffNickname,
            originalAmount: qrisResult.originalAmount,
            amountToPayWithFee: qrisResult.amountToPayWithFee,
            feeAmount: qrisResult.feeAmount,
            qrImageUrl: qrisResult.qrImageUrl,
            qrString: qrisResult.qrString,
            expiredAt: qrisResult.expiredAt,
            status: 'PENDING'
        });

        try {
            const savedTransaction = await newTransaction.save();
            console.log("Backend: /api/create-qris - Transaksi BERHASIL disimpan, ID:", savedTransaction._id, "orkutReffId:", savedTransaction.orkutReffId);
            res.json(qrisResult);
        } catch (dbError) {
            console.error("Backend: /api/create-qris - GAGAL menyimpan transaksi ke DB:", dbError.message, dbError.stack);
            console.error("Backend: /api/create-qris - Data yang gagal disimpan:", newTransaction.toObject());
            res.status(500).json({ success: false, message: 'Gagal menyimpan detail transaksi. Silakan coba lagi. Jika masalah berlanjut, hubungi admin. (DBErr)' });
        }

    } catch (error) {
        console.error("Backend: /api/create-qris - Error Umum:", error.message, error.stack);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server: ' + error.message });
    }
});

router.get('/check-status/:orkutReffId', async (req, res) => {
    const { orkutReffId } = req.params;
    console.log("Backend: /api/check-status - Cek untuk orkutReffId:", orkutReffId);

    if (!orkutReffId) {
        return res.status(400).json({ success: false, message: 'orkutReffId diperlukan.' });
    }
    try {
        const transaction = await Transaction.findOne({ orkutReffId: orkutReffId });

        if (!transaction) {
            console.warn("Backend: /api/check-status - Transaksi TIDAK DITEMUKAN di DB:", orkutReffId);
            return res.status(404).json({ success: false, isPaid: false, message: 'Transaksi tidak ditemukan. Pastikan Anda telah menyelesaikan langkah pembuatan pesanan sebelumnya.' });
        }
        console.log("Backend: /api/check-status - Transaksi DITEMUKAN:", transaction.orkutReffId, "Status DB:", transaction.status);

        if (transaction.status === 'PAID') {
            return res.json({ success: true, isPaid: true, message: 'Pembayaran sudah dikonfirmasi.' });
        }
        
        if (transaction.status === 'EXPIRED') {
            return res.json({ success: true, isPaid: false, message: 'Transaksi ini sudah kedaluwarsa.' });
        }

        if (new Date() > new Date(transaction.expiredAt)) {
             if (transaction.status !== 'EXPIRED') {
                 transaction.status = 'EXPIRED';
                 await transaction.save();
                 console.log("Backend: /api/check-status - Transaksi diupdate EXPIRED (waktu habis):", orkutReffId);
             }
            return res.json({ success: true, isPaid: false, message: 'Waktu pembayaran untuk transaksi ini telah habis.' });
        }

        const statusResult = await checkOrkutQrisPaymentStatus(orkutReffId, transaction.amountToPayWithFee, transaction.updatedAt);
        console.log("Backend: /api/check-status - Hasil OkeConnect:", statusResult.success, statusResult.isPaid, statusResult.message);
        
        if (statusResult.success && statusResult.isPaid) {
            transaction.status = 'PAID';
            transaction.paidAt = new Date();
            transaction.okeconnectTxDetails = statusResult.transaction;
            await transaction.save();
            console.log("Backend: /api/check-status - Transaksi diupdate PAID (dari OkeConnect):", orkutReffId);
            return res.json({ success: true, isPaid: true, message: 'Pembayaran berhasil dikonfirmasi.' });
        } else {
            let message = statusResult.message || 'Pembayaran belum ditemukan atau belum diproses oleh penyedia.';
            if (!statusResult.success && statusResult.message) { 
                message = `Gagal cek ke penyedia: ${statusResult.message}`;
            }
            return res.json({ success: true, isPaid: false, message: message });
        }
    } catch (error) {
        console.error("Backend: /api/check-status - Error Umum:", error.message, error.stack);
        res.status(500).json({ success: false, isPaid: false, message: 'Kesalahan server saat memeriksa status: ' + error.message });
    }
});

module.exports = router;