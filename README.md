# 🚑 Aapat Emergency Ambulance Service Platform

A comprehensive, real-time emergency response platform built with microservices architecture, featuring AI-powered dispatch, real-time tracking, and multi-channel communication.

## 🌟 Features

### Backend Services (Microservices Architecture)

#### 1. Emergency Request Service
- **Priority Classification**: AI-powered emergency priority assessment (Critical, High, Medium, Low)
- **Real-time Tracking**: Live emergency status updates
- **Symptom Analysis**: Advanced triage based on symptoms and vital signs
- **Location-based Handling**: GPS-enabled emergency processing

#### 2. Ambulance Management Service
- **Fleet Tracking**: Real-time GPS location monitoring
- **Driver Management**: Certification and performance tracking
- **Equipment Monitoring**: Vehicle equipment status and maintenance
- **Availability Management**: Dynamic fleet status updates

#### 3. Dispatch Service
- **Intelligent Assignment**: AI-powered ambulance selection algorithm
- **Traffic-aware Routing**: Real-time traffic consideration
- **Priority-based Dispatch**: Smart load balancing across fleet
- **ETA Calculations**: Accurate arrival time predictions

#### 4. Patient Management Service
- **Medical History**: Comprehensive patient records
- **Emergency Contacts**: Multi-contact management
- **Insurance Integration**: Seamless insurance verification
- **Care Continuity**: End-to-end patient journey tracking

#### 5. Hospital Integration Service
- **Bed Availability**: Real-time hospital capacity monitoring
- **Department Management**: Specialized department tracking
- **Admission Coordination**: Streamlined patient handover
- **Equipment Tracking**: Medical equipment availability

#### 6. Communication Service
- **Multi-channel Notifications**: SMS, Voice, Push, Email
- **Template Management**: Predefined message templates
- **Real-time Updates**: Live communication status tracking
- **Multi-language Support**: Localized communication

#### 7. Payment & Billing Service
- **Dynamic Pricing**: Distance and priority-based pricing
- **Insurance Processing**: Automated insurance claim handling
- **Multiple Payment Methods**: Card, UPI, Net Banking, Wallet
- **Government Scheme Integration**: Public healthcare support

#### 8. Analytics Service
- **Performance Metrics**: Response time analysis
- **Demand Forecasting**: Predictive analytics
- **Resource Optimization**: Fleet utilization insights
- **Real-time Dashboards**: Live operational metrics

### Frontend Applications

#### 1. Emergency Dashboard (Web)
- **Real-time Monitoring**: Live emergency status display
- **Interactive Maps**: GPS-enabled location tracking
- **Performance KPIs**: Key performance indicators
- **Priority Management**: Emergency priority visualization

#### 2. Public Emergency App (Mobile)
- **One-tap Emergency**: Instant emergency request
- **GPS Integration**: Automatic location detection
- **Real-time Tracking**: Live ambulance location
- **Emergency Contacts**: Quick contact management

#### 3. Driver/Paramedic App (Mobile)
- **Emergency Notifications**: Real-time call alerts
- **Navigation Integration**: GPS routing and navigation
- **Patient Information**: Access to patient records
- **Status Updates**: Real-time status reporting

#### 4. Hospital Staff Portal (Web)
- **Patient Management**: Incoming patient notifications
- **Bed Management**: Real-time capacity tracking
- **Handover Interface**: Seamless patient transfer
- **Equipment Status**: Medical equipment monitoring

#### 5. Admin Management Panel (Web)
- **System Monitoring**: Comprehensive system health
- **User Management**: Role-based access control
- **Fleet Configuration**: Ambulance and driver management
- **Performance Reports**: Detailed analytics and reporting

## 🏗️ Architecture

### Technology Stack

**Backend:**
- **Node.js** with Express.js
- **PostgreSQL** with PostGIS for location data
- **Redis** for caching and real-time data
- **Socket.io** for real-time communication
- **Docker** for containerization

**Frontend:**
- **React** with TypeScript
- **Socket.io-client** for real-time updates
- **Responsive Design** for multi-device support

**Infrastructure:**
- **Microservices Architecture**
- **API Gateway** for service orchestration
- **Docker Compose** for local development
- **PostGIS** for geospatial operations

### Database Schema

The platform uses a comprehensive PostgreSQL database with PostGIS extension for geospatial data:

- **Users & Authentication**: Role-based access control
- **Emergency Requests**: Complete emergency lifecycle
- **Patient Management**: Medical history and contacts
- **Ambulance Fleet**: Vehicle and driver management
- **Hospital Integration**: Capacity and department tracking
- **Communication Logs**: Multi-channel communication history
- **Billing & Payments**: Financial transaction management
- **Analytics & Metrics**: Performance and operational data

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd aapat
```

2. **Start the services:**
```bash
docker-compose up -d
```

3. **Access the applications:**
- **API Gateway**: http://localhost:3000
- **Emergency Dashboard**: http://localhost:3001
- **Frontend**: http://localhost:3000 (React app)

### Service Endpoints

| Service | Port | Health Check |
|---------|------|--------------|
| API Gateway | 3000 | http://localhost:3000/health |
| Emergency Service | 3001 | http://localhost:3001/health |
| Ambulance Service | 3002 | http://localhost:3002/health |
| Dispatch Service | 3003 | http://localhost:3003/health |
| Hospital Service | 3004 | http://localhost:3004/health |
| Patient Service | 3005 | http://localhost:3005/health |
| Communication Service | 3006 | http://localhost:3006/health |
| Billing Service | 3007 | http://localhost:3007/health |
| Analytics Service | 3008 | http://localhost:3008/health |

## 📱 API Documentation

### Emergency Request

**Create Emergency Request:**
```bash
POST /api/emergency/request
Content-Type: application/json

{
  "caller_phone": "+91-9876543210",
  "patient_info": {
    "name": "John Doe",
    "age": 45,
    "gender": "MALE",
    "blood_type": "O+"
  },
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "address": "123 MG Road, Bangalore",
  "emergency_type": "CARDIAC",
  "symptoms": "Chest pain, difficulty breathing",
  "conscious": true,
  "breathing": true,
  "pain_level": 8
}
```

**Get Emergency Status:**
```bash
GET /api/emergency/status/{emergency_id}
```

### Ambulance Management

**Get Available Ambulances:**
```bash
GET /api/ambulances/available/nearby?latitude=12.9716&longitude=77.5946&radius=10
```

**Update Ambulance Location:**
```bash
PUT /api/ambulances/{ambulance_id}/location
Content-Type: application/json

{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "heading": 45,
  "speed": 30
}
```

### Dispatch Management

**Assign Ambulance:**
```bash
POST /api/dispatch/assign
Content-Type: application/json

{
  "emergency_id": "uuid",
  "preferred_ambulance_id": "uuid"
}
```

**Update Dispatch Status:**
```bash
PUT /api/dispatch/status/{assignment_id}
Content-Type: application/json

{
  "status": "EN_ROUTE",
  "notes": "Ambulance en route to patient"
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=aapat_user
DB_PASSWORD=aapat_password
DB_NAME=aapat_db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-secret-key

# External Services
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

STRIPE_SECRET_KEY=sk_test_your_stripe_key
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

FIREBASE_SERVICE_ACCOUNT_KEY=your-firebase-key
```

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd services/emergency-service
npm test

# Frontend tests
cd frontend
npm test
```

### Load Testing

```bash
# Using Artillery for load testing
npm install -g artillery
artillery run load-test.yml
```

## 📊 Monitoring & Analytics

### Real-time Metrics

- **Response Time**: Average emergency response time
- **Fleet Utilization**: Ambulance availability and usage
- **Emergency Volume**: Real-time emergency request count
- **Hospital Capacity**: Live bed availability across hospitals

### Performance Monitoring

- **Service Health**: Individual microservice status
- **Database Performance**: Query performance and optimization
- **API Response Times**: Endpoint performance metrics
- **Error Rates**: System error tracking and alerting

## 🔒 Security Features

### Data Protection
- **HIPAA Compliance**: Medical data protection standards
- **End-to-end Encryption**: Secure data transmission
- **Role-based Access Control**: Granular permission management
- **API Rate Limiting**: Protection against abuse

### Authentication & Authorization
- **JWT Tokens**: Secure authentication
- **Multi-factor Authentication**: Enhanced security
- **Session Management**: Secure session handling
- **Audit Logging**: Comprehensive activity tracking

## 🚀 Deployment

### Production Deployment

1. **Configure Environment Variables**
2. **Set up SSL Certificates**
3. **Configure Load Balancer**
4. **Set up Monitoring and Logging**
5. **Deploy to Production Environment**

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Email**: support@aapat.com
- **Documentation**: [docs.aapat.com](https://docs.aapat.com)
- **Issues**: [GitHub Issues](https://github.com/aapat/issues)

## 🙏 Acknowledgments

- Emergency Medical Services community
- Open source contributors
- Healthcare technology innovators
- First responders and medical professionals

---

**Aapat Emergency Services** - *Saving lives, one call at a time* 🚑
