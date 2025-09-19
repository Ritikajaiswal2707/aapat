# 🧪 Aapat Platform - Mock Mode Testing

## 🎯 **What is Mock Mode?**

Mock Mode allows you to test the entire Aapat platform without needing real API keys. All external services (SMS, Payments, Maps) use fake data and simulated responses.

## 🚀 **Quick Start**

### **1. Start All Services in Mock Mode**
```bash
node start-mock-mode.js
```

### **2. Test Mock Services**
```bash
node test-mock-services.js
```

### **3. Run Comprehensive Tests**
```bash
node test-mock-mode.js
```

---

## 📋 **What Works in Mock Mode**

### **✅ FULLY FUNCTIONAL**
- Emergency request creation
- Ambulance dispatch and assignment
- Hospital bed management
- Real-time tracking
- Web dashboard
- Mobile applications
- Database operations
- User authentication
- Analytics and reporting

### **🟡 MOCK MODE (Fake Data)**
- **SMS Notifications** - Shows "SMS sent (mock mode)" messages
- **Payment Processing** - Creates fake payment orders
- **Maps Services** - Uses sample location data
- **Hospital Search** - Returns predefined hospital list

---

## 🔧 **Mock Mode Configuration**

### **SMS Service Mock**
```javascript
// Always returns success with mock data
{
  success: true,
  message: 'SMS sent successfully (MOCK MODE)',
  data: {
    sid: 'mock_sms_1234567890',
    status: 'sent'
  }
}
```

### **Payment Service Mock**
```javascript
// Creates fake payment orders
{
  success: true,
  message: 'Payment order created successfully (MOCK MODE)',
  data: {
    order_id: 'mock_order_1234567890',
    amount: 750,
    currency: 'INR',
    status: 'created'
  }
}
```

### **Maps Service Mock**
```javascript
// Returns sample location data
{
  success: true,
  message: 'Location service working (MOCK MODE)',
  data: {
    lat: 28.6139,
    lng: 77.2090,
    formatted_address: 'Delhi, India'
  }
}
```

---

## 📊 **Mock Data Available**

### **Hospitals (4 Sample Hospitals)**
- AIIMS Delhi - 150 beds available
- Safdarjung Hospital - 200 beds available
- Apollo Hospital - 100 beds available
- Max Hospital - 80 beds available

### **Ambulances (4 Sample Ambulances)**
- DL-01-AB-1234 (Basic) - Available
- DL-01-CD-5678 (Intermediate) - Available
- DL-01-EF-9012 (Advanced) - On Duty
- DL-01-GH-3456 (Critical Care) - Available

### **Emergency Types**
- Heart Attack (Priority 1)
- Stroke (Priority 1)
- Accident (Priority 2)
- Breathing Problems (Priority 2)
- Unconscious (Priority 2)
- Severe Pain (Priority 3)
- Fever (Priority 4)
- Minor Injury (Priority 4)

---

## 🧪 **Testing Scenarios**

### **1. Emergency Request Flow**
1. Create emergency request
2. System assigns ambulance
3. SMS sent to contacts (mock)
4. Payment order created (mock)
5. Real-time tracking works

### **2. Hospital Management**
1. View available beds
2. Search nearby hospitals
3. Update bed availability
4. Patient admission process

### **3. Ambulance Dispatch**
1. Find available ambulances
2. Assign to emergency
3. Track real-time location
4. Update status

---

## 🎮 **Interactive Testing**

### **Test Emergency Request**
```bash
curl -X POST http://localhost:3000/api/emergency/request \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name": "Test Patient",
    "patient_phone": "+91-98765-12345",
    "emergency_type": "Heart Attack",
    "priority_level": 1,
    "address": "Test Location",
    "latitude": 28.6139,
    "longitude": 77.2090
  }'
```

### **Test SMS Service**
```bash
curl -X POST http://localhost:3000/api/communication/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+91-98765-12345",
    "message": "Test message from Aapat!"
  }'
```

### **Test Payment Service**
```bash
curl -X POST http://localhost:3000/api/billing/payment \
  -H "Content-Type: application/json" \
  -d '{
    "emergency_request_id": "test_001",
    "amount": 750,
    "currency": "INR",
    "payment_method": "UPI"
  }'
```

---

## 📱 **Mobile App Testing**

### **Public Emergency App**
- Download and install the app
- Create emergency requests
- Track ambulance location
- Receive mock notifications

### **Driver App**
- Accept emergency assignments
- Update status
- Navigate to location (mock directions)
- Complete emergency

---

## 🌐 **Web Dashboard Testing**

### **Admin Dashboard**
- View all emergencies
- Manage ambulances
- Monitor hospital beds
- Analytics and reports

### **Hospital Dashboard**
- Update bed availability
- View incoming patients
- Manage departments
- Track capacity

---

## 🔄 **Switching to Real APIs**

When you're ready to use real APIs:

1. **Get API Keys:**
   - Twilio (SMS/Voice)
   - Razorpay (Payments)
   - Google Maps (Location)

2. **Update Environment:**
   ```bash
   # Set real API keys in .env file
   TWILIO_ACCOUNT_SID=your_real_sid
   TWILIO_AUTH_TOKEN=your_real_token
   RAZORPAY_KEY_ID=your_real_key
   GOOGLE_MAPS_API_KEY=your_real_key
   ```

3. **Disable Mock Mode:**
   ```javascript
   // In each service file, change:
   this.isConfigured = true; // Instead of false
   ```

---

## 🎯 **Benefits of Mock Mode**

### **For Development:**
- ✅ No API costs during development
- ✅ No rate limits or quotas
- ✅ Consistent test data
- ✅ Fast response times

### **For Testing:**
- ✅ Test all features without external dependencies
- ✅ Simulate various scenarios
- ✅ Debug without API issues
- ✅ Demo to stakeholders

### **For Learning:**
- ✅ Understand platform functionality
- ✅ Explore all features
- ✅ Practice emergency workflows
- ✅ Learn system architecture

---

## 🚀 **Next Steps**

1. **Start Mock Mode:** `node start-mock-mode.js`
2. **Test Services:** `node test-mock-services.js`
3. **Run Full Tests:** `node test-mock-mode.js`
4. **Explore Features:** Use web dashboard and mobile apps
5. **Get Real APIs:** When ready for production

---

## 📞 **Need Help?**

- Check console logs for detailed information
- All mock responses include helpful messages
- Services automatically fall back to mock mode
- No external dependencies required

**Happy Testing! 🎉**
