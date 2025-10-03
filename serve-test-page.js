const express = require('express');
const path = require('path');

const app = express();
const port = 8080;

// Serve static files
app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
    // Allow CORS for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-uber-system.html'));
});

app.listen(port, () => {
  console.log('🌟 Test Page Server started!');
  console.log(`📱 Open your browser to: http://localhost:${port}`);
  console.log('🚀 This will test your Uber-style ambulance system!');
});
