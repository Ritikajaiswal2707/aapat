const express = require('express');
const path = require('path');

const app = express();
const port = 8081;

// Serve static files
app.use(express.static('.'));

// Serve the working test page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'working-test.html'));
});

app.listen(port, () => {
  console.log(`🌟 Uber-Style Test Page Server Running!`);
  console.log(`🌐 Open in browser: http://localhost:${port}`);
  console.log(`📄 Test file: working-test.html`);
});
