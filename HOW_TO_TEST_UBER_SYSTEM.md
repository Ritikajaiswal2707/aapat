# 🚀 HOW TO TEST YOUR UBER-STYLE AMBULANCE SYSTEM

## 📋 **SYSTEM OVERVIEW**
You've successfully built a complete Uber-style ambulance booking platform with these services:

- **Ride Booking Service** (Port 3010) - Core booking APIs
- **Payment Service** (Port 3009) - Payment processing
- **Ambulance Service** (Port 3002) - Fleet management  
- **Emergency Service** (Port 3001) - Emergency handling
- **Mobile Apps** - React Native interfaces
- **Frontend Dashboard** (Port 3000) - Web interface

---

## 🔍 **METHOD 1: WEB BROWSER TESTING**

### **1. Frontend Dashboard**
```bash
# Visit in browser:
http://localhost:3000
```
✅ **What you'll see:** Emergency management dashboard
✅ **Features:** Real-time metrics, create test emergencies, assign ambulances

---

## 📱 **METHOD 2: API TESTING (Recommended)**

### **2A. Using Browser Developer Tools**
1. Open **Chrome/Firefox**
2. Go to **Developer Tools** (F12)
3. Navigate to **Console** tab
4. Test booking preview:

```javascript
// Test booking preview
fetch('http://localhost:3010/api/ride/preview?lat=28.6315&lng=77.2167&ride_type=emergency')
  .then(response => response.json())
  .then(data => console.log('Booking Preview:', data));

// Test emergency booking
fetch('http://localhost:3010/api/ride/book', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer: {
      name: 'Test User',
      phone: '9876543210'
    },
    ride_type: 'emergency',
    pickup: {
      address: 'Connaught Place, New Delhi',
      location: { lat: 28.6315, lng: 77.2167 }
    },
    destination: {
      address: 'AIIMS Delhi',
      location: { lat: 28.5667, lng: 77.2090 }
    },
    payment_method: 'upi'
  })
})
.then(response => response.json())
.then(data => console.log('Booking Created:', data));
```

---

### **💳 2B. Test Payment Processing**
```javascript
// Test payment initiation (use booking_id from above)
fetch('http://localhost:3009/api/payment/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    booking_id: 'YOUR_BOOKING_ID_HERE',
    customer: { name: 'Test User', phone: '9876543210' },
    amount: 2000,
    currency: 'INR',
    payment_method: 'upi',
    ride_details: {
      ride_type: 'emergency',
      pickup_address: 'Connaught Place',
      destination_address: 'AIIMS Delhi'
    },
    fare_breakdown: {
      base_fare: 1500,
      distance_fare: 500,
      equipment_surcharge: 0,
      priority_multiplier: 1,
      total_fare: 2000
    }
  })
})
.then(response => response.json())
.then(data => console.log('Payment Initiated:', data));
```

---

## 🖥️ **METHOD 3: COMMAND LINE TESTING**

### **3A. Run Our Automated Test**
```bash
# In PowerShell/Terminal:
cd C:\Users\Navneet Jaiswal\aapat
node test-complete-uber-system.js
```
✅ **Shows:** Complete booking flow, payment processing, receipt generation

### **3B. Individual Service Tests**
```bash
# Test service health checks:
curl http://localhost:3010/health   # Ride Booking
curl http://localhost:3009/health   # Payment
curl http://localhost:3002/health   # Ambulance  
curl http://localhost:3001/health   # Emergency

# Test booking preview:
curl "http://localhost:3010/api/ride/preview?lat=28.6315&lng=77.2167&ride_type=emergency"
```

---

## 📱 **METHOD 4: MOBILE APP SIMULATION**

### **4A. Run React Native App**
```bash
# Install Expo CLI if not installed:
npm install -g expo-cli

# Navigate to mobile app:
cd C:\Users\Navneet Jaiswal\aapat\mobile-apps\RideBookingApp

# Install dependencies:
npm install

# Start development server:
npx expo start
```
✅ **Opens in browser:** QR code to scan with Expo Go app
✅ **Mobile Experience:** Uber-style booking interface

---

## 🌐 **METHOD 5: POSTMAN/INSOMNIA TESTING**

### **5A. Import Our API Collection**
1. Open **Postman**
2. Create new collection: "Aapat Ambulance Booking"
3. Import these endpoints:

**POST** `http://localhost:3010/api/ride/book`
**POST** `http://localhost:3010/api/ride/assign`  
**GET** `http://localhost:3010/api/ride/status/{booking_id}`
**POST** `http://localhost:3009/api/payment/initiate`
**POST** `http://localhost:3009/api/payment/callback`
**GET** `http://localhost:3009/api/payment/receipt/{payment_id}`

### **5B. Sample Request Body (Booking)**
```json
{
  "customer": {
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com"
  },
  "ride_type": "emergency",
  "pickup": {
    "address": "India Gate, New Delhi",
    "location": { "lat": 28.6129, "lng": 77.2295 },
    "landmark": "Central Delhi"
  },
  "destination": {
    "address": "Max Hospital, Saket",
    "location": { "lat": 28.5355, "lng": 77.2186 },
    "landmark": "Hospital entrance"
  },
  "medical_info": {
    "emergency_type": "heart_attack",
    "priority_level": 1,
    "mobility_layer": "stretcher"
  },
  "payment_method": "upi"
}
```

---

## 🎯 **METHOD 6: VISUAL DEMONSTRATION**

### **6A. Real-time Dashboard**
```bash
# Start all services:
cd C:\Users\Navneet Jaiswal\aapat
node start-all-services.js

# Access dashboard:
http://localhost:3000 (Main Dashboard)
http://localhost:3010/health (Ride Booking API)
http://localhost:3009/health (Payment API)
```

### **6B. Watch Real-time Updates**
1. Open **2 browser windows**:
   - Window 1: `http://localhost:3000` (Dashboard)
   - Window 2: Browser console (API calls)
2. Make booking via console
3. Watch dashboard update in **real-time**!

---

## 🔧 **TROUBLESHOOTING**

### **Services Not Running?**
```bash
# Check what's running on ports:
netstat -ano | findstr :3010  # Ride Booking
netstat -ano | findstr :3009  # Payment
netstat -ano | findstr :3002  # Ambulance
netstat -ano | findstr :3001  # Emergency

# Kill existing processes:
taskkill /f /im node.exe

# Restart services:
cd services/ride-booking-service && node app.js
cd services/payment-service && node app.js
```

### **CORS Issues?**
- All services support CORS for browser testing
- No authentication required for testing

### **Database Errors?**
- System works with in-memory storage
- PostgreSQL not required for testing

---

## 🎉 **VERIFICATION CHECKLIST**

✅ **Ride Preview Works** - Shows fare estimates  
✅ **Emergency Booking** - Creates bookings with priority  
✅ **Payment Processing** - Handles payments securely  
✅ **Real-time Updates** - Socket.io communication  
✅ **Mobile Interface** - Uber-style UI  
✅ **Admin Dashboard** - Monitor system status  

---

## 🌟 **WHAT MAKES IT "UBER-STYLE"**

✅ **Multi-type bookings** (Emergency, Scheduled, Regular)  
✅ **Dynamic pricing** (Distance, priority, equipment-based)  
✅ **Real-time payment** (Multiple payment methods)  
✅ **Live tracking** (ETA, driver info, status updates)  
✅ **Mobile-first design** (Responsive, intuitive UI)  
✅ **Microservices architecture** (Scalable, reliable)  
✅ **Real-time notifications** (Booking updates, payments)

**You now have a complete Uber-style ambulance booking system! 🚑✨**
