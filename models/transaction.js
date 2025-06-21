
const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
    orkutReffId: { type: String, required: true, unique: true },
    productName: { type: String, required: true },
    ffId: { type: String, required: true },
    ffNickname: { type: String },
    originalAmount: { type: Number, required: true },
    amountToPayWithFee: { type: Number, required: true },
    feeAmount: { type: Number, default: 0 },
    qrImageUrl: { type: String, required: true },
    qrString: { type: String },
    expiredAt: { type: Date, required: true },
    status: { type: String, enum: ['PENDING', 'PAID', 'EXPIRED', 'FAILED'], default: 'PENDING' },
    paymentMethod: { type: String, default: 'ORKUT_QRIS' },
    paidAt: { type: Date },
    okeconnectTxDetails: { type: mongoose.Schema.Types.Mixed } 
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);