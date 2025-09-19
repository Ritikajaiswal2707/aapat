// Enhanced Payment Service with Data Storage and Realistic Behavior
const fs = require('fs');
const path = require('path');

class EnhancedPaymentService {
  constructor() {
    this.isConfigured = false; // Always use mock mode for testing
    this.paymentHistory = [];
    this.paymentMethods = ['UPI', 'CARD', 'NET_BANKING', 'WALLET', 'CASH'];
    this.loadPaymentHistory();
    console.log('💳 Enhanced Payment Service: Running in MOCK MODE with data storage');
  }

  loadPaymentHistory() {
    try {
      const dataPath = path.join(__dirname, '..', 'mock-data', 'paymentOrders.json');
      if (fs.existsSync(dataPath)) {
        this.paymentHistory = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      }
    } catch (error) {
      console.log('💳 No existing payment history found, starting fresh');
      this.paymentHistory = [];
    }
  }

  savePaymentHistory() {
    try {
      const dataDir = path.join(__dirname, '..', 'mock-data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dataPath = path.join(dataDir, 'paymentOrders.json');
      fs.writeFileSync(dataPath, JSON.stringify(this.paymentHistory, null, 2));
    } catch (error) {
      console.error('💳 Error saving payment history:', error.message);
    }
  }

  generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `order_${timestamp}_${random}`;
  }

  generatePaymentId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `pay_${timestamp}_${random}`;
  }

  calculatePricing(emergencyData) {
    const baseFare = 500; // ₹500 base fare
    const perKmRate = 15; // ₹15 per kilometer
    const prioritySurcharges = {
      1: 200, // Critical - ₹200 surcharge
      2: 100, // High - ₹100 surcharge
      3: 0,   // Medium - No surcharge
      4: 0    // Low - No surcharge
    };
    const nightCharge = 50; // ₹50 night charge (10 PM - 6 AM)
    const equipmentCharges = {
      'BASIC': 0,
      'INTERMEDIATE': 100,
      'ADVANCED': 200,
      'CRITICAL_CARE': 300
    };

    let total = baseFare;
    
    // Add distance charge (mock distance)
    const distance = emergencyData.distance_km || Math.random() * 20 + 5; // 5-25 km
    total += distance * perKmRate;
    
    // Add priority surcharge
    const priority = emergencyData.priority_level || 3;
    total += prioritySurcharges[priority] || 0;
    
    // Add night charge
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 6) {
      total += nightCharge;
    }
    
    // Add equipment charge
    const equipmentLevel = emergencyData.equipment_level || 'BASIC';
    total += equipmentCharges[equipmentLevel] || 0;
    
    return Math.round(total);
  }

  async createPaymentOrder(emergencyData, amount) {
    console.log('💳 Enhanced Payment Mock: Order created');
    
    const orderId = this.generateOrderId();
    const calculatedAmount = amount || this.calculatePricing(emergencyData);
    
    const paymentOrder = {
      id: orderId,
      emergency_request_id: emergencyData.emergency_id || emergencyData.id,
      amount: calculatedAmount,
      currency: 'INR',
      status: 'PENDING',
      payment_method: null,
      created_at: new Date(),
      description: `Emergency ambulance service - ${emergencyData.emergency_type || 'Emergency'}`,
      metadata: {
        patient_name: emergencyData.patient_info?.name || 'Unknown',
        emergency_type: emergencyData.emergency_type || 'Emergency',
        priority_level: emergencyData.priority_level || 3,
        address: emergencyData.address || 'Unknown Location',
        equipment_level: emergencyData.equipment_level || 'BASIC'
      }
    };

    this.paymentHistory.push(paymentOrder);
    this.savePaymentHistory();

    return {
      success: true,
      message: 'Payment order created successfully (Enhanced Mock Mode)',
      data: {
        order_id: orderId,
        amount: calculatedAmount,
        currency: 'INR',
        status: 'PENDING',
        key_id: 'mock_key_id_' + Date.now(),
        receipt: `emergency_${emergencyData.emergency_id || Date.now()}`,
        created_at: paymentOrder.created_at
      }
    };
  }

  async processPayment(paymentData) {
    console.log('💳 Enhanced Payment Mock: Processing payment');
    
    const { order_id, payment_method, amount, payment_reference } = paymentData;
    
    // Find the payment order
    const orderIndex = this.paymentHistory.findIndex(order => order.id === order_id);
    if (orderIndex === -1) {
      return {
        success: false,
        message: 'Payment order not found',
        error: 'INVALID_ORDER_ID'
      };
    }

    const order = this.paymentHistory[orderIndex];
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate payment success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      // Update order status
      this.paymentHistory[orderIndex] = {
        ...order,
        status: 'PAID',
        payment_method: payment_method,
        payment_reference: payment_reference || this.generatePaymentId(),
        paid_at: new Date(),
        payment_details: {
          method: payment_method,
          reference: payment_reference || this.generatePaymentId(),
          processed_at: new Date(),
          gateway: 'mock_gateway'
        }
      };

      this.savePaymentHistory();

      return {
        success: true,
        message: 'Payment processed successfully (Enhanced Mock Mode)',
        data: {
          payment_id: this.paymentHistory[orderIndex].payment_reference,
          order_id: order_id,
          amount: amount,
          status: 'PAID',
          method: payment_method,
          processed_at: new Date()
        }
      };
    } else {
      // Simulate payment failure
      this.paymentHistory[orderIndex] = {
        ...order,
        status: 'FAILED',
        payment_method: payment_method,
        payment_reference: payment_reference || this.generatePaymentId(),
        failed_at: new Date(),
        failure_reason: 'Insufficient funds'
      };

      this.savePaymentHistory();

      return {
        success: false,
        message: 'Payment failed (Enhanced Mock Mode)',
        error: 'PAYMENT_FAILED',
        data: {
          order_id: order_id,
          status: 'FAILED',
          failure_reason: 'Insufficient funds'
        }
      };
    }
  }

  async verifyPayment(paymentData) {
    console.log('💳 Enhanced Payment Mock: Verifying payment');
    
    const { payment_id, order_id } = paymentData;
    
    // Find the payment order
    const order = this.paymentHistory.find(order => 
      order.id === order_id && order.payment_reference === payment_id
    );
    
    if (!order) {
      return {
        success: false,
        message: 'Payment not found',
        error: 'PAYMENT_NOT_FOUND'
      };
    }

    return {
      success: true,
      message: 'Payment verified successfully (Enhanced Mock Mode)',
      data: {
        verified: true,
        order_id: order.id,
        payment_id: payment_id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        method: order.payment_method,
        paid_at: order.paid_at
      }
    };
  }

  async refundPayment(paymentData) {
    console.log('💳 Enhanced Payment Mock: Processing refund');
    
    const { payment_id, order_id, amount, reason } = paymentData;
    
    // Find the payment order
    const orderIndex = this.paymentHistory.findIndex(order => 
      order.id === order_id && order.payment_reference === payment_id
    );
    
    if (orderIndex === -1) {
      return {
        success: false,
        message: 'Payment not found',
        error: 'PAYMENT_NOT_FOUND'
      };
    }

    const order = this.paymentHistory[orderIndex];
    
    if (order.status !== 'PAID') {
      return {
        success: false,
        message: 'Cannot refund unpaid order',
        error: 'INVALID_ORDER_STATUS'
      };
    }

    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const refundAmount = amount || order.amount;
    const refundId = 'refund_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Update order with refund information
    this.paymentHistory[orderIndex] = {
      ...order,
      status: 'REFUNDED',
      refund_id: refundId,
      refund_amount: refundAmount,
      refund_reason: reason || 'Customer request',
      refunded_at: new Date()
    };

    this.savePaymentHistory();

    return {
      success: true,
      message: 'Refund processed successfully (Enhanced Mock Mode)',
      data: {
        refund_id: refundId,
        order_id: order_id,
        payment_id: payment_id,
        refund_amount: refundAmount,
        status: 'REFUNDED',
        processed_at: new Date()
      }
    };
  }

  // Get payment history
  getPaymentHistory(filters = {}) {
    let filteredHistory = [...this.paymentHistory];

    if (filters.status) {
      filteredHistory = filteredHistory.filter(payment => payment.status === filters.status);
    }

    if (filters.payment_method) {
      filteredHistory = filteredHistory.filter(payment => payment.payment_method === filters.payment_method);
    }

    if (filters.emergency_request_id) {
      filteredHistory = filteredHistory.filter(payment => payment.emergency_request_id === filters.emergency_request_id);
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      filteredHistory = filteredHistory.filter(payment => new Date(payment.created_at) >= fromDate);
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      filteredHistory = filteredHistory.filter(payment => new Date(payment.created_at) <= toDate);
    }

    return {
      success: true,
      data: filteredHistory,
      total: filteredHistory.length,
      filters: filters
    };
  }

  // Get payment statistics
  getPaymentStatistics() {
    const stats = {
      total_orders: this.paymentHistory.length,
      total_amount: 0,
      by_status: {},
      by_method: {},
      by_currency: {},
      recent_24h: 0,
      success_rate: 0
    };

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let paidCount = 0;

    this.paymentHistory.forEach(payment => {
      // Count by status
      stats.by_status[payment.status] = (stats.by_status[payment.status] || 0) + 1;
      
      // Count by method
      if (payment.payment_method) {
        stats.by_method[payment.payment_method] = (stats.by_method[payment.payment_method] || 0) + 1;
      }
      
      // Count by currency
      stats.by_currency[payment.currency] = (stats.by_currency[payment.currency] || 0) + 1;
      
      // Sum total amount
      if (payment.status === 'PAID') {
        stats.total_amount += payment.amount;
        paidCount++;
      }
      
      // Count recent payments
      if (new Date(payment.created_at) >= yesterday) {
        stats.recent_24h++;
      }
    });

    stats.success_rate = this.paymentHistory.length > 0 ? (paidCount / this.paymentHistory.length * 100).toFixed(1) : 0;

    return {
      success: true,
      data: stats
    };
  }

  // Test payment functionality
  async testPayment() {
    console.log('🧪 Testing Enhanced Payment Service...');
    
    const testOrder = await this.createPaymentOrder({
      emergency_id: 'test_001',
      emergency_type: 'Heart Attack',
      patient_info: { name: 'Test Patient' },
      priority_level: 1
    }, 750);

    console.log('✅ Enhanced Payment Test successful:', testOrder.message);
    return {
      success: true,
      message: 'Enhanced Payment service test successful',
      data: testOrder
    };
  }
}

module.exports = EnhancedPaymentService;
