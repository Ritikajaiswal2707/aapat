# 🏥 Hospital Integration System

## Overview

The Aapat Emergency System now includes **Intelligent Hospital Matching** that automatically recommends the best hospital for each emergency based on multiple factors.

---

## 🎯 How It Works

When an emergency request is created, the system automatically:

1. **Analyzes the Emergency**
   - Emergency type (cardiac, trauma, respiratory, etc.)
   - Severity/priority level
   - Required medical equipment

2. **Scores All Hospitals**
   - Specialty match (40 points)
   - Equipment availability (30 points)
   - Bed availability (20 points)
   - Distance/ETA (10 points)
   - Hospital rating (5 points)

3. **Returns Top Recommendations**
   - Ranked by score (0-100)
   - Top recommendation marked with ⭐
   - Shows distance, ETA, and bed availability

---

## 🚀 Quick Start

### Start the System
```bash
# Option 1: Start all services together
node start-complete-system.js

# Option 2: Start services individually
node hospital-matching-service.js      # Port 3013
node uber-style-driver-matching-service.js  # Port 3012
node serve-dashboard-simple.js         # Port 3000
```

### Test Hospital Integration
```bash
node test-hospital-integration.js
```

---

## 🏥 Hospital Data

The system includes **8 real Delhi hospitals**:

| Hospital | Specialties | Beds | Equipment |
|----------|------------|------|-----------|
| AIIMS Delhi | Cardiac, Trauma, Neurology | 200 General, 50 ICU | ICU, Cath Lab, CT, MRI, Ventilators |
| Max Saket | Cardiac, Neurology, Orthopedic | 150 General, 40 ICU | ICU, Cath Lab, CT, MRI |
| Apollo Jasola | Cardiac, Trauma, Maternity | 180 General, 45 ICU | ICU, NICU, Burn Unit |
| Fortis Escorts | Cardiac, Vascular | 120 General, 35 ICU | ICU, Cath Lab, ECMO |
| Safdarjung | Trauma, Burns, Orthopedic | 250 General, 60 ICU | ICU, Burn Unit, Blood Bank |
| Sir Ganga Ram | Cardiac, Neurology, Respiratory | 160 General, 42 ICU | ICU, CT, MRI, Dialysis |
| Manipal Dwarka | General, Maternity, Pediatric | 140 General, 38 ICU | ICU, NICU, Blood Bank |
| BLK Pusa Road | Cardiac, Neurology, Oncology | 130 General, 36 ICU | ICU, Cath Lab, PET Scan |

---

## 📊 Matching Algorithm

### Emergency Type → Hospital Specialty Mapping

| Emergency Type | Required Specialty | Required Equipment |
|----------------|-------------------|-------------------|
| Heart Attack / Cardiac | Cardiac | Cath Lab, ICU, Ventilators |
| Stroke / Neurological | Neurology | CT Scan, MRI, ICU |
| Accident / Trauma | Trauma | CT Scan, Blood Bank, ICU |
| Breathing Issues | Respiratory | Ventilators, ICU |
| Burns | Burns | Burn Unit, ICU |
| Maternity | Maternity | NICU |
| Broken Bones | Orthopedic | - |

### Scoring System

```
Total Score (0-100) =
  Specialty Match (0-40) +
  Equipment Match (0-30) +
  Bed Availability (0-20) +
  Distance Factor (0-10) +
  Hospital Rating (0-5)
```

**Penalties:**
- No beds available: -50 points
- No specialty match: -20 points

---

## 🌐 API Endpoints

### Get All Hospitals
```bash
GET http://localhost:3013/api/hospitals
```

### Get Hospital Recommendations
```bash
POST http://localhost:3013/api/hospitals/recommend
Content-Type: application/json

{
  "location": {
    "lat": 28.6315,
    "lng": 77.2167
  },
  "emergency_type": "heart attack",
  "priority": "critical",
  "bed_type": "icu"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emergency_type": "heart attack",
    "priority": "critical",
    "required_specialty": "cardiac",
    "required_equipment": ["cath_lab", "icu", "ventilators"],
    "recommendations": [
      {
        "id": "hospital-004",
        "name": "Fortis Escorts Heart Institute",
        "distance": 0.12,
        "eta": 1,
        "score": 95,
        "recommended": true,
        "beds": {
          "general": { "total": 120, "available": 15 },
          "icu": { "total": 35, "available": 6 },
          "emergency": { "total": 20, "available": 7 }
        },
        "match_reasons": {
          "specialty_match": true,
          "has_required_equipment": true,
          "beds_available": 6,
          "distance_km": 0.12
        }
      }
    ],
    "total_available": 8
  }
}
```

### Get Specific Hospital
```bash
GET http://localhost:3013/api/hospitals/:id
```

### Update Bed Availability
```bash
PUT http://localhost:3013/api/hospitals/:id/beds
Content-Type: application/json

{
  "bed_type": "icu",
  "available": 10
}
```

---

## 🎨 Dashboard Features

### Emergency Details Panel

When you click "Details" on an emergency, you'll see:

1. **Emergency Information**
   - Priority level
   - Emergency type
   - Patient details
   - Status

2. **Hospital Recommendations** (New!)
   - Top 3 recommended hospitals
   - Score (color-coded)
   - Distance & ETA
   - Bed availability
   - Specialty match indicator
   - Equipment match indicator

3. **Visual Indicators**
   - ⭐ = Top recommendation
   - 🏥 = Hospital
   - 📍 = Distance
   - ⏱️ = ETA
   - 🛏️ = Beds available
   - ✅ = Specialty match

---

## 📱 Usage Examples

### Example 1: Cardiac Emergency
```bash
# Request
{
  "emergency_type": "heart attack",
  "priority": "critical",
  "location": { "lat": 28.6315, "lng": 77.2167 }
}

# Top Recommendation
Fortis Escorts Heart Institute
- Score: 95/100
- Distance: 0.12 km
- ETA: 1 min
- Specialty Match: ✅
- Equipment Match: ✅ (Cath Lab, ICU, ECMO)
- ICU Beds Available: 6
```

### Example 2: Trauma Emergency
```bash
# Request
{
  "emergency_type": "accident",
  "priority": "high",
  "location": { "lat": 28.5672, "lng": 77.2100 }
}

# Top Recommendation
AIIMS Delhi
- Score: 92/100
- Distance: 0.15 km
- ETA: 1 min
- Specialty Match: ✅
- Equipment Match: ✅ (CT Scan, Blood Bank, ICU)
- Emergency Beds Available: 12
```

---

## 🔧 Configuration

### Add New Hospitals

Edit `hospital-matching-service.js`:

```javascript
const mockHospitals = [
  {
    id: 'hospital-009',
    name: 'Your Hospital Name',
    location: { lat: 28.xxxx, lng: 77.xxxx },
    address: 'Address',
    contact: '+91-xxxxxxxxxx',
    specialties: ['cardiac', 'general'],
    equipment: ['icu', 'ct_scan'],
    beds: {
      general: { total: 100, available: 25 },
      icu: { total: 20, available: 5 },
      emergency: { total: 15, available: 8 }
    },
    rating: 4.5,
    emergency_ready: true
  }
];
```

### Adjust Scoring Weights

```javascript
// In matchHospital function
score += specialty_match ? 40 : 20;  // Adjust specialty weight
score += (equipmentMatch / requiredEquipment.length) * 30;  // Equipment weight
score += (availabilityRatio) * 20;  // Bed availability weight
```

---

## 🧪 Testing

### Test the Complete Flow

```bash
# 1. Start all services
node start-complete-system.js

# 2. In another terminal, run the test
node test-hospital-integration.js
```

### Test Different Emergency Types

```javascript
// Cardiac Emergency
emergency_type: 'heart attack'
priority: 'critical'

// Trauma Emergency
emergency_type: 'accident'
priority: 'high'

// Respiratory Emergency
emergency_type: 'breathing issue'
priority: 'critical'

// Burn Emergency
emergency_type: 'burns'
priority: 'high'
```

---

## 📈 Next Steps

1. **Real Hospital Integration**
   - Connect to actual hospital APIs
   - Real-time bed availability updates
   - Hospital confirmation system

2. **Advanced Features**
   - Hospital portal for bed management
   - Bed reservation system
   - Patient handoff tracking
   - Ambulance → Hospital routing
   - ETA updates to hospitals

3. **Analytics**
   - Track most recommended hospitals
   - Monitor hospital capacity trends
   - Analyze emergency → hospital matching efficiency

---

## 🆘 Troubleshooting

### Hospital Service Not Starting
```bash
# Check if port 3013 is in use
netstat -ano | findstr :3013

# If occupied, kill the process or change port in hospital-matching-service.js
```

### No Recommendations Received
```bash
# Check hospital service is running
curl http://localhost:3013/health

# Check driver service logs for hospital API calls
```

### Recommendations Not Showing in Dashboard
1. Ensure hospital service is running
2. Check browser console for errors
3. Verify emergency has `recommended_hospitals` field
4. Restart dashboard service

---

## 📞 Support

For issues or questions:
1. Check the console logs
2. Run the test script: `node test-hospital-integration.js`
3. Verify all services are running
4. Check the browser developer console

---

**Made with ❤️ for saving lives faster** 🚑🏥

