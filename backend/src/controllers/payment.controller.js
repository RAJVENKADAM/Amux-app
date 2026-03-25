// controllers/payment.controller.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Course = require('../models/Course.model');
const Payment = require('../models/Payment.model');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ================= 1️⃣ Create Razorpay Order =================
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId;

    // Fetch course
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Fee calculation: ₹1 per topic in paise
    const fee = course.topics.length * 100;
    const amount = fee;

    // Razorpay receipt (max 40 chars)
    const receipt = `${userId.toString().slice(-8)}_${courseId.toString().slice(-8)}`;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt
    });

    // Save order in DB
    const payment = new Payment({
      user: userId,
      course: courseId,
      razorpayOrderId: order.id,
      amount: order.amount,
      fee,
      status: 'created',
      currency: 'INR',
      receipt,
      topicsUnlocked: 1 // first topic free
    });
    await payment.save();

    res.json({ order, course });
  } catch (err) {
    console.error('Create order error:', err.error || err);
    res.status(500).json({ message: 'Failed to create order', error: err.error || err });
  }
};

// ================= 2️⃣ Verify Razorpay Payment =================
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, courseId } = req.body;
    const userId = req.user.id;

    // Check signature
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      // Update payment status to failed
      await Payment.findOneAndUpdate(
        { user: userId, course: courseId, razorpayOrderId },
        { status: 'failed' }
      );
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update payment as paid
    await Payment.findOneAndUpdate(
      { user: userId, course: courseId, razorpayOrderId },
      {
        status: 'paid',
        razorpayPaymentId,
        razorpaySignature,
        topicsUnlocked: 1 // first topic free
      }
    );

    // Increment course views on successful payment
    const Course = require('../models/Course.model');
    const course = await Course.findById(courseId);
    if (course) {
      course.views += 1;
      await course.save();
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

// ================= 3️⃣ Get User's Purchased Courses =================
exports.getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;

    const payments = await Payment.find({ user: userId, status: 'paid' })
      .populate('course');

    res.json({ payments });
  } catch (err) {
    console.error('Get user payments error:', err);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};

// ================= 4️⃣ Get Course Payment Count =================
exports.getCoursePaymentCount = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const count = await Payment.countDocuments({ 
      course: courseId, 
      status: 'paid' 
    });
    
    res.json({ 
      success: true, 
      count 
    });
  } catch (err) {
    console.error('Get payment count error:', err);
    res.status(500).json({ message: 'Failed to fetch payment count' });
  }
};
