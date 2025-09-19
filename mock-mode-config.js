// Mock Mode Configuration for Aapat Platform
// This file ensures all services run in mock mode for testing

const mockConfig = {
  // Force all services to use mock mode
  services: {
    sms: {
      enabled: true,
      mockMode: true,
      mockResponses: true
    },
    payment: {
      enabled: true,
      mockMode: true,
      mockOrders: true
    },
    maps: {
      enabled: true,
      mockMode: true,
      mockLocations: true
    },
    firebase: {
      enabled: false, // Disable Firebase for testing
      mockMode: true
    }
  },

  // Mock data settings
  data: {
    useMockHospitals: true,
    useMockAmbulances: true,
    useMockPatients: true,
    useMockEmergencies: true
  },

  // API responses
  responses: {
    sms: {
      success: true,
      message: 'SMS sent successfully (MOCK MODE)',
      mockSid: 'mock_sms_'
    },
    payment: {
      success: true,
      message: 'Payment processed successfully (MOCK MODE)',
      mockOrderId: 'mock_order_'
    },
    maps: {
      success: true,
      message: 'Location service working (MOCK MODE)',
      mockPlaceId: 'mock_place_'
    }
  },

  // Mock delays (in milliseconds)
  delays: {
    sms: 100,
    payment: 200,
    maps: 150,
    database: 50
  }
};

// Override service configurations
function configureMockMode() {
  // SMS Service Mock Configuration
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    process.env.SMS_MOCK_MODE = 'true';
    process.env.PAYMENT_MOCK_MODE = 'true';
    process.env.MAPS_MOCK_MODE = 'true';
    process.env.FIREBASE_MOCK_MODE = 'true';
  }

  // Console logging
  console.log('🔧 Mock Mode Configuration Applied:');
  console.log('   📱 SMS Service: Mock Mode');
  console.log('   💳 Payment Service: Mock Mode');
  console.log('   🗺️ Maps Service: Mock Mode');
  console.log('   🔔 Firebase: Disabled (Mock Mode)');
  console.log('   📊 All services will use fake data for testing');
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mockConfig,
    configureMockMode
  };
} else {
  // Browser environment
  window.mockConfig = mockConfig;
  window.configureMockMode = configureMockMode;
}

// Auto-configure if this file is run directly
if (require.main === module) {
  configureMockMode();
}
