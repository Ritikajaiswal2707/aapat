const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Handle all other routes by serving index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '_frontend/build', 'index.html'));
});

// Fallback for all routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', '_index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Aapat Frontend Dashboard: http://localhost:${port}`);
  console.log('📊 Emergency Management Interface ready!');
  console.log('🏥 Hospital Portal: Open hospital-portal/index.html in browser');
});
