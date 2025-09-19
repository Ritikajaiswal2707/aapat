# 🔑 API Keys & External Services Setup

## 🎉 **Current Status: All Features Working!**

✅ **Test Results:**
- Health Check: ✅ Working
- Emergency Requests: ✅ Working  
- Ambulance Management: ✅ Working
- Hospital Integration: ✅ Working
- Analytics Dashboard: ✅ Working
- Mobile Apps: ✅ Ready for testing
- Hospital Portal: ✅ Ready for testing

## 🔑 **Required API Keys for Next Phase**

### **Priority 1: Essential Services**

#### 1. **SMS & Communication Services**
**Twilio** (Recommended for SMS)
- **API Key:** `TWILIO_ACCOUNT_SID`
- **Secret:** `TWILIO_AUTH_TOKEN`
- **Phone Number:** `TWILIO_PHONE_NUMBER`
- **Cost:** ~$0.0075 per SMS
- **Setup:** https://console.twilio.com/

**Alternative: TextLocal (India-focused)**
- **API Key:** `TEXTLOCAL_API_KEY`
- **Cost:** ~₹0.15 per SMS
- **Setup:** https://www.textlocal.in/

#### 2. **Payment Processing**
**Razorpay** (India-focused)
- **Key ID:** `RAZORPAY_KEY_ID`
- **Key Secret:** `RAZORPAY_KEY_SECRET`
- **Webhook Secret:** `RAZORPAY_WEBHOOK_SECRET`
- **Cost:** 2% per transaction
- **Setup:** https://dashboard.razorpay.com/

**Alternative: Stripe**
- **Publishable Key:** `STRIPE_PUBLISHABLE_KEY`
- **Secret Key:** `STRIPE_SECRET_KEY`
- **Webhook Secret:** `STRIPE_WEBHOOK_SECRET`
- **Cost:** 2.9% + $0.30 per transaction
- **Setup:** https://dashboard.stripe.com/

#### 3. **Maps & Navigation**
**Google Maps** (Recommended)
- **API Key:** `GOOGLE_MAPS_API_KEY`
- **Cost:** $7 per 1000 requests
- **Setup:** https://console.cloud.google.com/
- **Required APIs:**
  - Maps JavaScript API
  - Directions API
  - Geocoding API
  - Places API

**Alternative: Mapbox**
- **Access Token:** `MAPBOX_ACCESS_TOKEN`
- **Cost:** Free tier available
- **Setup:** https://account.mapbox.com/

### **Priority 2: Advanced Features**

#### 4. **Push Notifications**
**Firebase Cloud Messaging**
- **Server Key:** `FIREBASE_SERVER_KEY`
- **Project ID:** `FIREBASE_PROJECT_ID`
- **Cost:** Free tier available
- **Setup:** https://console.firebase.google.com/

#### 5. **Voice & Speech Services**
**Google Cloud Speech-to-Text**
- **API Key:** `GOOGLE_SPEECH_API_KEY`
- **Cost:** $0.006 per 15 seconds
- **Setup:** https://console.cloud.google.com/

**Alternative: Azure Speech Services**
- **Subscription Key:** `AZURE_SPEECH_KEY`
- **Region:** `AZURE_SPEECH_REGION`
- **Cost:** $1 per hour
- **Setup:** https://portal.azure.com/

#### 6. **AI & Machine Learning**
**OpenAI API** (For AI triage)
- **API Key:** `OPENAI_API_KEY`
- **Cost:** $0.002 per 1K tokens
- **Setup:** https://platform.openai.com/

**Alternative: Google Cloud AI**
- **API Key:** `GOOGLE_AI_API_KEY`
- **Cost:** Pay per use
- **Setup:** https://console.cloud.google.com/

### **Priority 3: Optional Services**

#### 7. **Email Services**
**SendGrid**
- **API Key:** `SENDGRID_API_KEY`
- **Cost:** Free tier (100 emails/day)
- **Setup:** https://app.sendgrid.com/

#### 8. **File Storage**
**AWS S3**
- **Access Key ID:** `AWS_ACCESS_KEY_ID`
- **Secret Access Key:** `AWS_SECRET_ACCESS_KEY`
- **Bucket Name:** `AWS_S3_BUCKET`
- **Cost:** $0.023 per GB
- **Setup:** https://aws.amazon.com/s3/

#### 9. **Database Hosting**
**PostgreSQL Hosting**
- **Heroku Postgres:** `DATABASE_URL`
- **Supabase:** `SUPABASE_URL` + `SUPABASE_ANON_KEY`
- **Railway:** `DATABASE_URL`

## 🚀 **Quick Setup Guide**

### **Step 1: Create .env file**
```bash
# Copy the example file
cp .env.example .env
```

### **Step 2: Add API Keys**
```env
# SMS Services
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Processing
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Maps & Navigation
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Push Notifications
FIREBASE_SERVER_KEY=your_firebase_server_key
FIREBASE_PROJECT_ID=your_firebase_project_id

# Voice Services
GOOGLE_SPEECH_API_KEY=your_google_speech_api_key

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aapat_db
```

### **Step 3: Test API Keys**
```bash
# Test SMS
node test-sms.js

# Test Payment
node test-payment.js

# Test Maps
node test-maps.js
```

## 💰 **Cost Estimation (Monthly)**

### **Basic Setup (Essential)**
- **Twilio SMS:** ~$50 (1000 SMS)
- **Razorpay:** 2% of transactions
- **Google Maps:** ~$100 (10K requests)
- **Total:** ~$150/month

### **Advanced Setup (Full Features)**
- **All Basic Services:** ~$150
- **Firebase:** Free tier
- **Google Speech:** ~$50
- **OpenAI:** ~$100
- **AWS S3:** ~$20
- **Total:** ~$320/month

### **Enterprise Setup**
- **All Services:** ~$500-1000/month
- **Dedicated servers:** ~$200-500/month
- **Monitoring & Analytics:** ~$100-200/month
- **Total:** ~$800-1700/month

## 🔒 **Security Best Practices**

### **API Key Management**
1. **Never commit API keys to Git**
2. **Use environment variables**
3. **Rotate keys regularly**
4. **Use different keys for dev/staging/prod**
5. **Monitor API usage**

### **Environment Setup**
```bash
# Development
.env.development

# Staging
.env.staging

# Production
.env.production
```

## 🧪 **Testing Without API Keys**

### **Mock Services**
- **SMS:** Use console.log for testing
- **Payment:** Use test mode
- **Maps:** Use static maps
- **Voice:** Use browser APIs

### **Test Mode Configuration**
```javascript
// Enable test mode
const TEST_MODE = process.env.NODE_ENV === 'development';

if (TEST_MODE) {
  // Use mock services
  console.log('SMS: Mock message sent');
} else {
  // Use real services
  await sendSMS(message);
}
```

## 🎯 **Next Steps**

### **Phase 1: Get Essential API Keys**
1. **Twilio** for SMS (30 minutes)
2. **Razorpay** for payments (30 minutes)
3. **Google Maps** for navigation (30 minutes)

### **Phase 2: Implement Services**
1. **SMS Integration** (2 hours)
2. **Payment Processing** (3 hours)
3. **Maps Integration** (4 hours)

### **Phase 3: Advanced Features**
1. **Push Notifications** (2 hours)
2. **Voice Commands** (4 hours)
3. **AI Features** (6 hours)

---

**Ready to get API keys?** Start with Twilio, Razorpay, and Google Maps for the essential features! 🚀
