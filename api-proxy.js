const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 5000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Proxy for ride booking service
app.use('/ride-booking', async (req, res) => {
  try {
    const url = `http://localhost:3010${req.url}`;
    console.log('🚑 Proxying to Ride Booking:', url);
    
    let response;
    if (req.method === 'GET') {
      response = await axios.get(url);
    } else if (req.method === 'POST') {
      response = await axios.post(url, req.body);
    } else {
      response = await axios(req.method, url, { data: req.body });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('❌ Ride Booking Proxy Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      success: false
    });
  }
});

// Proxy for payment service
app.use('/payment', async (req, res) => {
  try {
    const url = `http://localhost:3009${req.url}`;
    console.log('💳 Proxying to Payment:', url);
    
    let response;
    if (req.method === 'GET') {
      response = await axios.get(url);
    } else if (req.method === 'POST') {
      response = await axios.post(url, req.body);
    } else {
      response = await axios(req.method, url, { data: req.body });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('❌ Payment Proxy Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      success: false
    });
  }
});

// Proxy for ambulance service
app.use('/ambulance', async (req, res) => {
  try {
    const url = `http://localhost:3002${req.url}`;
    console.log('🚑 Proxying to Ambulance:', url);
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Ambulance Proxy Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      success: false
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'API Proxy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🌐 API Proxy running on http://localhost:${port}`);
  console.log(`📡 Proxying requests to avoid CORS issues`);
});