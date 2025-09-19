# 📱 Twilio SMS Setup Guide

## 🎉 **SMS Integration Successfully Added!**

✅ **Current Status:**
- SMS service is integrated and working in mock mode
- All SMS endpoints are functional
- Emergency requests now trigger SMS notifications
- Custom SMS sending is available

## 🔧 **To Enable Real SMS (Next Steps)**

### **Step 1: Get a Twilio Phone Number**

1. **Go to Twilio Console:** https://console.twilio.com/
2. **Navigate to Phone Numbers:** Phone Numbers > Manage > Buy a number
3. **Choose a number:**
   - Select your country (India: +91)
   - Choose a number with SMS capabilities
   - Cost: ~$1/month per number

### **Step 2: Update Configuration**

Once you have a real Twilio number, update the `sms-service.js` file:

```javascript
// Replace this line in sms-service.js
const twilioPhoneNumber = '+1234567890'; // Replace with your real number

// With your actual Twilio number
const twilioPhoneNumber = '+91XXXXXXXXXX'; // Your real Twilio number
```

### **Step 3: Test Real SMS**

```bash
# Test SMS functionality
node test-sms.js

# Test custom SMS
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "message": "Test message from Aapat!"}'
```

## 📱 **SMS Features Available**

### **1. Emergency Alerts**
- **Trigger:** When emergency is reported
- **Recipients:** Patient's emergency contacts
- **Content:** Emergency type, location, ETA, patient info

### **2. Driver Assignments**
- **Trigger:** When ambulance is assigned
- **Recipients:** Ambulance driver
- **Content:** Emergency details, location, priority

### **3. Status Updates**
- **Trigger:** When status changes
- **Recipients:** Patient/family
- **Content:** Current status, ETA, updates

### **4. Hospital Notifications**
- **Trigger:** When patient is en route
- **Recipients:** Hospital staff
- **Content:** Patient info, emergency type, ETA

### **5. Custom SMS**
- **Trigger:** Manual or automated
- **Recipients:** Any phone number
- **Content:** Custom message

## 🔧 **API Endpoints**

### **Health Check**
```bash
GET /health
# Returns SMS service status
```

### **SMS Test**
```bash
GET /api/sms/test
# Tests SMS service connectivity
```

### **Send Custom SMS**
```bash
POST /api/sms/send
Content-Type: application/json

{
  "phone": "+919876543210",
  "message": "Your custom message here"
}
```

### **Emergency Request (with SMS)**
```bash
POST /api/emergency/request
Content-Type: application/json

{
  "caller_phone": "+919876543210",
  "patient_info": {
    "name": "John Doe",
    "age": 30,
    "gender": "MALE",
    "blood_type": "O+"
  },
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "address": "Delhi, India",
  "emergency_type": "CARDIAC",
  "symptoms": "Chest pain",
  "conscious": true,
  "breathing": true,
  "pain_level": 8
}
```

## 💰 **Cost Estimation**

### **Twilio Pricing (India)**
- **Phone Number:** ~$1/month
- **SMS (India):** ~$0.0075 per SMS
- **Monthly Cost (1000 SMS):** ~$8.50

### **Usage Scenarios**
- **Low Volume (100 SMS/month):** ~$1.75
- **Medium Volume (1000 SMS/month):** ~$8.50
- **High Volume (5000 SMS/month):** ~$38.50

## 🧪 **Testing Commands**

### **Test All Features**
```bash
# Run comprehensive SMS test
node test-sms.js

# Test web interfaces
node test-web-interfaces.js

# Test all features
node test-features.js
```

### **Test Individual Endpoints**
```bash
# Health check
curl http://localhost:3000/health

# SMS test
curl http://localhost:3000/api/sms/test

# Send test SMS
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "message": "Test from Aapat!"}'
```

## 🔒 **Security Best Practices**

### **Phone Number Validation**
- Validate phone numbers before sending
- Use international format (+91XXXXXXXXXX)
- Rate limit SMS sending

### **Message Content**
- Sanitize user input
- Avoid sensitive information in SMS
- Use templates for consistency

### **Error Handling**
- Log all SMS attempts
- Handle delivery failures
- Implement retry logic

## 🚀 **Next Steps**

### **Immediate (Today)**
1. **Get Twilio phone number** (15 minutes)
2. **Update configuration** (5 minutes)
3. **Test real SMS** (10 minutes)

### **Short Term (This Week)**
1. **Add SMS templates** for different scenarios
2. **Implement delivery status tracking**
3. **Add SMS preferences for users**
4. **Create SMS analytics dashboard**

### **Long Term (Next Month)**
1. **Multi-language SMS support**
2. **SMS scheduling and automation**
3. **Advanced SMS analytics**
4. **Integration with other communication channels**

## 📊 **Monitoring & Analytics**

### **SMS Metrics to Track**
- Delivery success rate
- Response time
- Cost per SMS
- User engagement
- Error rates

### **Logging**
```javascript
// SMS logs are automatically created
console.log('📱 SMS sent:', {
  to: phoneNumber,
  message: message,
  status: 'sent',
  timestamp: new Date()
});
```

---

**Ready to get your Twilio number?** Visit https://console.twilio.com/ and follow the steps above! 🚀
