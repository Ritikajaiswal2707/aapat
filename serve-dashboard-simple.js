const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BUILD_DIR = path.join(__dirname, 'frontend', 'build');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle root path
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(BUILD_DIR, filePath);

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // If file not found, serve index.html for client-side routing
        fs.readFile(path.join(BUILD_DIR, 'index.html'), (error, content) => {
          if (error) {
            res.writeHead(500);
            res.end('Error loading index.html');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('🌐 Aapat Emergency Dashboard Server Started');
  console.log('='.repeat(60));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📁 Serving: ${BUILD_DIR}`);
  console.log('='.repeat(60));
  console.log('\n✅ Dashboard Features:');
  console.log('   • Emergency Requests Dashboard');
  console.log('   • Ambulance Booking System');
  console.log('   • Driver Fleet Management');
  console.log('   • Real-time Status Updates');
  console.log('\n💡 Make sure driver matching service is running:');
  console.log('   node start-emergency-system.js');
  console.log('\n🛑 Press Ctrl+C to stop the server\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log('💡 Try: Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force');
  } else {
    console.error('❌ Server error:', err);
  }
});

