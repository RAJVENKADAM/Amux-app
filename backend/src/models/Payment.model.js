// models/Payment.model.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String },      // ✅ optional on order creation
  razorpaySignature: { type: String },      // ✅ optional on order creation
  amount: { type: Number, required: true }, // INR paise
  fee: { type: Number, required: true },    // topics.length * 100 paise
  currency: { type: String, default: 'INR' },
  receipt: String,
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  topicsUnlocked: { type: Number, default: 1 }, // First topic free
}, { timestamps: true });

// Indexes for fast lookup
PaymentSchema.index({ user: 1, course: 1 });
PaymentSchema.index({ razorpayOrderId: 1 });
module.exports = mongoose.model('Payment', PaymentSchema);