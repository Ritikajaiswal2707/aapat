// Razorpay Payment Service for Aapat Platform
const Razorpay = require('razorpay');

// Razorpay Configuration
const razorpayKeyId = 'rzp_test_RFghxBO5zdCwb';
const razorpayKeySecret = 'c4kCtdCxSaNBZmJvcQWZL2LY';

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret
});

class PaymentService {
  constructor() {
    // Force mock mode for testing
    this.isConfigured = false; // Always use mock mode for testing
    console.log('💳 Payment Service: Running in MOCK MODE for testing');
  }

  // Create payment order for emergency service
  async createPaymentOrder(emergencyData, amount) {
    if (!this.isConfigured) {
      console.log('💳 Payment Mock: Order created');
      return {
        success: true,
        message: 'Payment order created (mock mode)',
        data: {
          order_id: 'mock_order_' + Date.now(),
          amount: amount,
          currency: 'INR',
          status: 'created'
        }
      };
    }

    try {
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `emergency_${emergencyData.emergency_id || Date.now()}`,
        notes: {
          emergency_type: emergencyData.emergency_type,
          patient_name: emergencyData.patient_info?.name || 'Unknown',
          location: emergencyData.address
        }
      };

      const order = await razorpay.orders.create(options);

      return {
        success: true,
        message: 'Payment order created successfully',
        data: {
          order_id: order.id,
          amount: amount,
          currency: 'INR',
          key_id: razorpayKeyId,
          status: 'created',
          receipt: order.receipt
        }
      };

    } catch (error) {
      console.error('Payment Error:', error);
      return {
        success: false,
        message: 'Failed to create payment order',
        error: error.message
      };
    }
  }

  // Verify payment signature
  async verifyPayment(paymentData) {
    if (!this.isConfigured) {
      console.log('💳 Payment Mock: Payment verified');
      return {
        success: true,
        message: 'Payment verified (mock mode)',
        data: {
          payment_id: 'mock_payment_' + Date.now(),
          status: 'captured'
        }
      };
    }

    try {
      const crypto = require('crypto');
      const body = paymentData.razorpay_order_id + '|' + paymentData.razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body.toString())
        .digest('hex');

      const isValid = expectedSignature === paymentData.razorpay_signature;

      if (isValid) {
        return {
          success: true,
          message: 'Payment verified successfully',
          data: {
            payment_id: paymentData.razorpay_payment_id,
            order_id: paymentData.razorpay_order_id,
            status: 'captured'
          }
        };
      } else {
        return {
          success: false,
          message: 'Invalid payment signature',
          data: null
        };
      }

    } catch (error) {
      console.error('Payment Verification Error:', error);
      return {
        success: false,
        message: 'Payment verification failed',
        error: error.message
      };
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    if (!this.isConfigured) {
      console.log('💳 Payment Mock: Payment details retrieved');
      return {
        success: true,
        message: 'Payment details retrieved (mock mode)',
        data: {
          payment_id: paymentId,
          amount: 500,
          currency: 'INR',
          status: 'captured',
          method: 'card'
        }
      };
    }

    try {
      const payment = await razorpay.payments.fetch(paymentId);

      return {
        success: true,
        message: 'Payment details retrieved successfully',
        data: {
          payment_id: payment.id,
          amount: payment.amount / 100, // Convert from paise to rupees
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          created_at: payment.created_at
        }
      };

    } catch (error) {
      console.error('Payment Details Error:', error);
      return {
        success: false,
        message: 'Failed to retrieve payment details',
        error: error.message
      };
    }
  }

  // Calculate dynamic pricing based on emergency type and distance
  calculateEmergencyPricing(emergencyType, distance, priority) {
    let basePrice = 500; // Base price in INR

    // Emergency type multiplier
    const typeMultipliers = {
      'CARDIAC': 1.5,
      'TRAUMA': 1.3,
      'RESPIRATORY': 1.2,
      'NEUROLOGICAL': 1.4,
      'PEDIATRIC': 1.1,
      'GENERAL': 1.0
    };

    // Priority multiplier
    const priorityMultipliers = {
      1: 2.0, // Critical
      2: 1.5, // High
      3: 1.2, // Medium
      4: 1.0  // Low
    };

    // Distance multiplier (per km)
    const distanceMultiplier = 10; // 10 INR per km

    const typeMultiplier = typeMultipliers[emergencyType] || 1.0;
    const priorityMultiplier = priorityMultipliers[priority] || 1.0;

    const totalPrice = Math.round(
      (basePrice * typeMultiplier * priorityMultiplier) + 
      (distance * distanceMultiplier)
    );

    return {
      base_price: basePrice,
      type_multiplier: typeMultiplier,
      priority_multiplier: priorityMultiplier,
      distance_charge: distance * distanceMultiplier,
      total_price: totalPrice,
      currency: 'INR'
    };
  }

  // Test payment functionality
  async testPayment() {
    console.log('🧪 Testing Payment Service...');
    
    if (!this.isConfigured) {
      console.log('⚠️  Razorpay not configured, using mock mode');
      return { success: true, message: 'Payment service ready (mock mode)' };
    }

    try {
      // Test with a small amount
      const testOrder = await this.createPaymentOrder({
        emergency_id: 'test_' + Date.now(),
        emergency_type: 'GENERAL',
        patient_info: { name: 'Test Patient' },
        address: 'Test Location'
      }, 100);

      console.log('✅ Payment Test successful:', testOrder.data?.order_id);
      return {
        success: true,
        message: 'Payment test successful',
        order_id: testOrder.data?.order_id
      };

    } catch (error) {
      console.error('❌ Payment Test failed:', error.message);
      
      // Check if it's an authentication error
      if (error.statusCode === 401 || error.message.includes('Authentication failed')) {
        return {
          success: false,
          message: 'Payment authentication failed - please check Razorpay credentials',
          error: 'Authentication failed. Please verify your Razorpay Key ID and Key Secret.',
          suggestion: 'Visit https://dashboard.razorpay.com/ to verify your credentials'
        };
      }
      
      return {
        success: false,
        message: 'Payment test failed',
        error: error.message
      };
    }
  }
}

module.exports = PaymentService;
