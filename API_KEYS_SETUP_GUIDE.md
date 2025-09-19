# 🔑 Aapat Platform - API Keys Setup Guide

## Current Status
✅ **Working:** Twilio, Razorpay, Database, Redis, JWT  
❌ **Missing:** Google Maps, Firebase

---

## 1. Google Maps API Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing (required for Maps API)

### Step 2: Enable Required APIs
Enable these APIs in your project:
- **Maps JavaScript API** - For interactive maps
- **Directions API** - For route planning
- **Geocoding API** - For address conversion
- **Places API** - For nearby hospitals search

### Step 3: Create API Key
1. Go to "Credentials" in the left menu
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Restrict the key for security

### Step 4: Update Environment
```env
GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Test
```bash
node test-api-keys.js
```

---

## 2. Firebase Push Notifications Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "Aapat Emergency"
4. Enable Google Analytics (optional)

### Step 2: Add Web App
1. Click "Add app" > Web icon
2. Register app with name: "Aapat Emergency Web"
3. Copy the config object

### Step 3: Enable Cloud Messaging
1. Go to Project Settings > Cloud Messaging
2. Copy the "Server Key" (not the Web API Key)

### Step 4: Update Environment
```env
FIREBASE_SERVER_KEY=AAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Test
```bash
node test-api-keys.js
```

---

## 3. Complete Environment File

Create/update your `.env` file with all keys:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=aapat_user
DB_PASSWORD=aapat_password
DB_NAME=aapat_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret
JWT_SECRET=GFlAsYpaKyY5zyKqYi0j1LLAtPmaL2r+n/cnSus4Ob4=

# Twilio for SMS/Calls
TWILIO_ACCOUNT_SID=ACa4cc047c52d3f093275ff9144c4ec351
TWILIO_AUTH_TOKEN=fcc0e7431199c26382f30bc3a0ccda22
TWILIO_PHONE_NUMBER=+16674463150

# Firebase for Push Notifications
FIREBASE_SERVER_KEY=your_firebase_server_key_here

# Payment Gateway (Razorpay for India)
RAZORPAY_KEY_ID=rzp_test_RFghxBO5zdCwb
RAZORPAY_KEY_SECRET=c4kCtdCxSaNBZmJvcQWZL2LY

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# App Configuration
APP_NAME=Aapat
APP_DESCRIPTION=Emergency Ambulance Service Platform
FRONTEND_URL=http://localhost:3001
API_URL=http://localhost:3000
```

---

## 4. Testing Your Setup

### Run the Test Script
```bash
node test-api-keys.js
```

### Expected Output
```
🚑 Aapat Emergency Service - API Keys Test

==================================================
🧪 Testing Twilio SMS Service...
✅ Twilio SMS Test: SUCCESS
   Message SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Status: queued

🧪 Testing Razorpay Payment Service...
✅ Razorpay Payment Test: SUCCESS
   Order ID: order_xxxxxxxxxxxxxxxxxxxxx
   Amount: ₹10

🧪 Testing Database Connection...
✅ Database Test: SUCCESS
   Current Time: 2024-01-15 10:30:45.123456+00

🧪 Testing Redis Connection...
✅ Redis Test: SUCCESS
   Test Value: Aapat Emergency Service

🧪 Testing Google Maps API...
✅ Google Maps Test: SUCCESS
   API Status: OK
   Results: 1 found

==================================================
📊 Test Results Summary:
==================================================
TWILIO      : ✅ WORKING
RAZORPAY    : ✅ WORKING
DATABASE    : ✅ WORKING
REDIS       : ✅ WORKING
GOOGLEMAPS  : ✅ WORKING
==================================================
Overall Status: 5/5 services working
🎉 All services are working perfectly!
```

---

## 5. Troubleshooting

### Common Issues

#### Twilio SMS Not Working
- **Issue:** "Authenticate" error
- **Solution:** Verify account SID and auth token
- **Check:** Account status in Twilio console

#### Razorpay Payment Failing
- **Issue:** "Invalid key" error
- **Solution:** Ensure you're using test keys for development
- **Check:** Key ID format should start with "rzp_test_"

#### Google Maps API Error
- **Issue:** "API key not valid" error
- **Solution:** Enable required APIs in Google Cloud Console
- **Check:** Billing is enabled on the project

#### Database Connection Failed
- **Issue:** "Connection refused" error
- **Solution:** Ensure PostgreSQL is running
- **Check:** Database credentials and host

#### Redis Connection Failed
- **Issue:** "Connection refused" error
- **Solution:** Ensure Redis is running
- **Check:** Redis host and port

---

## 6. Security Best Practices

### API Key Security
1. **Never commit API keys to version control**
2. **Use environment variables for all sensitive data**
3. **Rotate keys regularly**
4. **Use different keys for development/production**
5. **Monitor API usage and set up alerts**

### Environment File Security
```bash
# Add .env to .gitignore
echo ".env" >> .gitignore

# Set proper file permissions
chmod 600 .env
```

---

## 7. Cost Estimation

| Service | Monthly Cost | Usage Limit |
|---------|-------------|-------------|
| Twilio | $8.50 | 1,000 SMS |
| Razorpay | 2% per transaction | No limit |
| Google Maps | $100 | 10,000 requests |
| Firebase | Free | 10,000 messages |
| **Total** | **~$108.50** | **Base cost** |

---

## 8. Next Steps

Once all API keys are configured:

1. **Test the complete platform:**
   ```bash
   npm run test:all
   ```

2. **Start the services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the applications:**
   - Emergency Dashboard: http://localhost:3000
   - Mobile Apps: http://localhost:3000/mobile
   - Hospital Portal: http://localhost:3000/hospital

4. **Monitor the logs:**
   ```bash
   docker-compose logs -f
   ```

---

## 🆘 Support

If you encounter any issues:

1. **Check the test script output** for specific error messages
2. **Verify API key format** and permissions
3. **Check service status** in respective consoles
4. **Review the troubleshooting section** above

**Ready to save lives! 🚑✨**
