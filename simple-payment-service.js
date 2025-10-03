const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3009;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// In-memory payment store
const payments = new Map();

// Simplified payment initiation
app.post('/api/payment/initiate', async (req, res) => {
  try {
    const { booking_id, amount, payment_method, user_id, currency = 'INR' } = req.body;

    // Simple validation
    if (!booking_id || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: booking_id, amount, payment_method'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be positive'
      });
    }

    // Create mock payment order
    const paymentOrder = {
      id: uuidv4(),
      booking_id,
      user_id: user_id || 'user-' + Date.now(),
      amount,
      currency,
      payment_method,
      status: 'pending',
      order_id: 'order_' + uuidv4().slice(0, 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store payment
    payments.set(paymentOrder.id, paymentOrder);

    console.log(`💳 Payment initiated: ${paymentOrder.id} for booking ${booking_id}`);

    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        payment_id: paymentOrder.id,
        order_id: paymentOrder.order_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        status: paymentOrder.status,
        payment_method: paymentOrder.payment_method
      }
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
});

// Get payment status
app.get('/api/payment/status/:id', (req, res) => {
  try {
    const { id } = req.params;
    const payment = payments.get(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
});

// Mock payment webhook (simulate payment capture)
app.post('/api/payment/webhook', (req, res) => {
  try {
    const { event, payload } = req.body;
    
    console.log(`📨 Webhook received: ${event}`);

    if (event === 'payment.captured') {
      const razorpayPayment = payload.payment.entity;
      const orderId = razorpayPayment.order_id;

      // Find payment by order ID
      let paymentRecord = null;
      for (const [id, payment] of payments) {
        if (payment.order_id === orderId) {
          paymentRecord = payment;
          break;
        }
      }

      if (paymentRecord) {
        paymentRecord.status = 'completed';
        paymentRecord.razorpay_payment_id = razorpayPayment.id;
        paymentRecord.updated_at = new Date().toISOString();
        payments.set(paymentRecord.id, paymentRecord);
        
        console.log(`✅ Payment ${paymentRecord.id} captured successfully`);
      } else {
        console.log(`⚠️ Payment record not found for order ID: ${orderId}`);
      }
    }

    res.status(200).send('Webhook processed');

  } catch (error) {
    console.error('Webhook error:', error);

    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Aapat Payment Service (Simple Mode)',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: 'development',
    provider: 'mock',
    active_payments: payments.size
  });
});

app.listen(PORT, () => {
  console.log(`💳 Aapat Payment Service (Simple Mode) running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
