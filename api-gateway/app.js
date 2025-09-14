const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// Service URLs
const services = {
  emergency: process.env.EMERGENCY_SERVICE_URL || 'http://emergency-service:3001',
  ambulance: process.env.AMBULANCE_SERVICE_URL || 'http://ambulance-service:3002',
  dispatch: process.env.DISPATCH_SERVICE_URL || 'http://dispatch-service:3003',
  hospital: process.env.HOSPITAL_SERVICE_URL || 'http://hospital-service:3004',
  patient: process.env.PATIENT_SERVICE_URL || 'http://patient-service:3005',
  communication: process.env.COMMUNICATION_SERVICE_URL || 'http://communication-service:3006',
  billing: process.env.BILLING_SERVICE_URL || 'http://billing-service:3007',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3008'
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Aapat API Gateway',
    timestamp: new Date().toISOString(),
    emergency_service: services.emergency
  });
});

// Proxy configuration
const createProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout: 30000,
    onError: (err, req, res) => {
      console.error('Proxy Error:', err.message);
      res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable'
      });
    }
  });
};

// Routes
app.use('/api/emergency', createProxy(services.emergency));
app.use('/api/ambulances', createProxy(services.ambulance));
app.use('/api/dispatch', createProxy(services.dispatch));
app.use('/api/hospitals', createProxy(services.hospital));
app.use('/api/patients', createProxy(services.patient));
app.use('/api/communication', createProxy(services.communication));
app.use('/api/billing', createProxy(services.billing));
app.use('/api/analytics', createProxy(services.analytics));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚑 Aapat API Gateway running on port ' + PORT);
  console.log('🔍 Health check: http://localhost:' + PORT + '/health');
});