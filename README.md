# 🚑 Aapat Emergency Platform

**Uber-style Ambulance Booking System** - Complete emergency medical transport platform with real-time driver matching, OTP verification, and payment processing.

## 🚀 Features

### 🤖 Uber-Style Functionality
- **📱 Ride Request Broadcasting** - Sends requests to all nearby drivers
- **🚑 Driver Acceptance System** - Real-time driver matching and acceptance
- **🔐 OTP Authentication** - Secure customer-driver verification
- **💳 Payment Processing** - Automatic payment at ride completion
- **📊 Real-time Tracking** - Live driver and ride status updates
- **🎯 Dynamic Pricing** - Automated fare calculation based on distance, equipment, and priority

### 🏥 Medical Emergency Features
- **⚡ Emergency Dispatch** - Immediate ambulance assignment for critical cases
- **📅 Scheduled Rides** - Advance booking for non-emergency medical transport
- **🚑 Medical Equipment** - Type-specific ambulance matching (Basic, Advanced, Critical Care)
- **📞 Emergency Communication** - Real-time updates between patient, driver, and hospital

## 🏗️ Architecture

### Microservices Design
```
🚗 Driver Matching Service (Port 3012) - Core Uber functionality
💳 Payment Service (Port 3009) - Payment processing
🚑 Ambulance Service (Port 3002) - Fleet management
📱 Booking Service (Port 3010) - Ride booking management
🌐 API Proxy (Port 5000) - Cross-origin request handling
```

### Core Services

#### 🚗 **uber-style-driver-matching-service.js**
Main Uber-style driver matching and ride management service:
- Real-time driver availability checking
- Ride request broadcasting to nearby drivers
- Driver acceptance/rejection handling
- OTP generation and verification
- Complete ride lifecycle management

#### 💳 **simple-payment-service.js**
Payment processing service with support for:
- UPI, Credit/Debit Cards, Cash payments
- Insurance billing integration
- Automatic fare calculation
- Payment gateway integration (Razorpay ready)

#### 🚑 **simple-ambulance-service.js**
Ambulance fleet management:
- Driver and vehicle information
- Equipment level tracking (Basic/Advanced/Critical Care)
- Real-time location updates
- Availability management

#### 📱 **simple-ride-booking-service.js**
Booking management service:
- Ride request processing
- Fare estimation
- Booking confirmation and tracking

## 📱 Mobile Applications

### React Native Apps
- **mobile-apps/RideBookingApp/** - Customer mobile app (Uber-style interface)
- **Patient App** - Emergency request interface
- **Driver App** - Driver acceptance and navigation interface

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- npm/yarn

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/Ritikajaiswal2707/aapat.git
   cd aapat
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Core Services**
   ```bash
   # Start Driver Matching Service (Main Uber functionality)
   node uber-style-driver-matching-service.js
   
   # Start Payment Service
   node simple-payment-service.js
   
   # Start Ambulance Service  
   node simple-ambulance-service.js
   
   # Start Ride Booking Service
   node simple-ride-booking-service.js
   
   # Start API Proxy
   node api-proxy.js
   ```

### Service Endpoints

- **Driver Matching:** http://localhost:3012
- **Payment Processing:** http://localhost:3009  
- **Ambulance Management:** http://localhost:3002
- **Booking Service:** http://localhost:3010
- **API Proxy:** http://localhost:5000

## 🧪 Testing

### Health Checks
```bash
curl http://localhost:3012/health
curl http://localhost:3009/health
curl http://localhost:3002/health
curl http://localhost:3010/health
```

### Testing API Flow

1. **Request Ride**
   ```bash
   curl -X POST http://localhost:3012/api/ride/request \
     -H "Content-Type: application/json" \
     -d '{
       "customer": {"name": "Test Patient", "phone": "9876543210"},
       "ride_type": "emergency",
       "pickup_location": {"lat": 28.6315, "lng": 77.2167, "address": "Delhi"},
       "destination_location": {"lat": 28.5667, "lng": 77.2090, "address": "Hospital"}
     }'
   ```

2. **Driver Accepts Ride**
   ```bash
   curl -X POST http://localhost:3012/api/driver/driver-001/accept \
     -H "Content-Type: application/json" \
     -d '{"ride_request_id": "your-ride-id"}'
   ```

3. **Generate OTP**
   ```bash
   curl -X POST http://localhost:3012/api/ride/your-ride-id/generate-otp
   ```

4. **Verify OTP & Complete Ride**
   ```bash
   curl -X POST http://localhost:3012/api/driver/driver-001/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"ride_request_id": "your-ride-id", "otp_entered": "1234"}'
   ```

## 📊 System Status

**Current Capabilities:**
- ✅ Multi-driver concurrent ride management
- ✅ Real-time driver availability tracking  
- ✅ Secure OTP-based authentication
- ✅ Dynamic pricing engine (₹2,250 base + multipliers)
- ✅ Complete payment integration
- ✅ Professional driver management system

## 🌟 Business Model

**Revenue Streams:**
- Ride fare commissions
- Premium driver membership
- Emergency response surcharges
- Corporate medical transport contracts

**Market Differentiation:**
- Focus on medical emergencies vs regular taxi service
- Professional paramedic drivers
- Medical equipment-equipped vehicles
- Hospital integration capabilities

## 🔧 Technology Stack

- **Backend:** Node.js, Express.js
- **Real-time:** Socket.io
- **Payment:** Razorpay integration ready
- **Mobile:** React Native
- **Architecture:** Microservices
- **Security:** OTP verification system
- **Monitoring:** Health check endpoints

## 📈 Scalability

- **Multi-city deployment support**
- **Driver onboarding system**
- **Hospital partner integration**
- **Government emergency service integration**
- **Insurance company partnerships**

## 🤝 Contributing

This platform is designed to revolutionize emergency medical transport by applying Uber's proven business model to medical services.

**Key Innovation:** Combining Uber's efficiency with medical emergency urgency - making reliable medical transport as accessible as ordering a taxi.

---

**🚑 The Future of Emergency Medical Transport** - Just like Uber, but for life-saving services.