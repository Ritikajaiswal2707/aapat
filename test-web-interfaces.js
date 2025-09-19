// Test web interfaces accessibility
const http = require('http');

const testUrl = (url, description) => {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${description}: ${res.statusCode} - ${data.length} bytes`);
          resolve(true);
        } else {
          console.log(`❌ ${description}: ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${description}: Timeout`);
      req.destroy();
      resolve(false);
    });
  });
};

async function testWebInterfaces() {
  console.log('🌐 Testing Web Interfaces...\n');
  
  const tests = [
    { url: 'http://localhost:3000', description: 'Emergency Dashboard' },
    { url: 'http://localhost:3000/mobile', description: 'Mobile Apps Directory' },
    { url: 'http://localhost:3000/hospital', description: 'Hospital Portal' },
    { url: 'http://localhost:3000/health', description: 'Health Check API' }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const result = await testUrl(test.url, test.description);
    if (result) passed++;
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} interfaces working`);
  
  if (passed === total) {
    console.log('🎉 All web interfaces are accessible!');
    console.log('\n📱 Open these URLs in your browser:');
    console.log('   - Emergency Dashboard: http://localhost:3000');
    console.log('   - Mobile Apps: http://localhost:3000/mobile');
    console.log('   - Hospital Portal: http://localhost:3000/hospital');
  } else {
    console.log('⚠️  Some interfaces may need attention');
  }
}

testWebInterfaces();
