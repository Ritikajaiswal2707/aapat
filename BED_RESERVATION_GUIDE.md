# 🛏️ Hospital Bed Reservation System

## Overview

The bed reservation system allows ambulances to reserve beds at hospitals while en route, ensuring availability upon arrival. This eliminates the critical problem of reaching a hospital only to find no beds available.

---

## 🎯 Key Features

### 1. **Automatic Bed Reservation**
- Reserve bed at recommended hospital
- Deducts from available bed count immediately
- Prevents double-booking

### 2. **Smart Expiry System**
- Reservations auto-expire after ETA + 15 min buffer
- Expired beds automatically released
- Prevents long-term bed blocking

### 3. **Real-Time Tracking**
- Track reservation status (active, completed, cancelled, expired)
- Monitor all hospital reservations
- System-wide reservation dashboard

### 4. **Patient Arrival Confirmation**
- Hospital confirms patient arrival
- Updates reservation to completed
- Tracks confirmation details

### 5. **Cancellation Support**
- Cancel reservations with reason
- Immediately releases bed
- Maintains cancellation history

---

## 🚀 API Endpoints

### Reserve a Bed

```http
POST /api/hospitals/:hospitalId/reserve-bed
Content-Type: application/json

{
  "ride_request_id": "RIDE-123",
  "bed_type": "icu",              // icu, emergency, general
  "patient_name": "John Doe",
  "emergency_type": "heart attack",
  "priority": "critical",
  "eta_minutes": 15,
  "requester_phone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bed reserved successfully",
  "reservation": {
    "id": "RES-1234567890-abc123",
    "hospital_name": "Fortis Escorts Heart Institute",
    "hospital_address": "Okhla Road, New Delhi",
    "hospital_contact": "+91-11-47135000",
    "bed_type": "icu",
    "reserved_at": "2025-10-03T12:30:00.000Z",
    "expires_at": "2025-10-03T13:00:00.000Z",
    "eta_minutes": 15
  }
}
```

---

### Cancel Reservation

```http
POST /api/reservations/:reservationId/cancel
Content-Type: application/json

{
  "reason": "Patient condition stabilized"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reservation cancelled successfully",
  "reservation": {
    "id": "RES-1234567890-abc123",
    "status": "cancelled",
    "cancelled_at": "2025-10-03T12:35:00.000Z",
    "cancellation_reason": "Patient condition stabilized"
  }
}
```

---

### Confirm Patient Arrival

```http
POST /api/reservations/:reservationId/confirm-arrival
Content-Type: application/json

{
  "confirmed_by": "Dr. Smith",
  "notes": "Patient admitted to ICU Ward 3, Bed 12"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Patient arrival confirmed",
  "reservation": {
    "id": "RES-1234567890-abc123",
    "status": "completed",
    "confirmed_by": "Dr. Smith",
    "confirmed_at": "2025-10-03T12:45:00.000Z",
    "arrival_notes": "Patient admitted to ICU Ward 3, Bed 12"
  }
}
```

---

### Get Reservation Details

```http
GET /api/reservations/:reservationId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "RES-1234567890-abc123",
    "hospital_id": "hospital-004",
    "hospital_name": "Fortis Escorts Heart Institute",
    "ride_request_id": "RIDE-123",
    "bed_type": "icu",
    "patient_name": "John Doe",
    "emergency_type": "heart attack",
    "priority": "critical",
    "eta_minutes": 15,
    "requester_phone": "9876543210",
    "status": "active",
    "reserved_at": "2025-10-03T12:30:00.000Z",
    "expires_at": "2025-10-03T13:00:00.000Z",
    "confirmed_by_hospital": false
  }
}
```

---

### Get Hospital Reservations

```http
GET /api/hospitals/:hospitalId/reservations?status=active
```

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `completed`, `cancelled`, `expired`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "RES-1234567890-abc123",
      "patient_name": "John Doe",
      "bed_type": "icu",
      "status": "active",
      "reserved_at": "2025-10-03T12:30:00.000Z"
    }
  ],
  "total": 1
}
```

---

### Get All Reservations

```http
GET /api/reservations?status=active
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 10,
  "active": 5,
  "completed": 3,
  "cancelled": 2
}
```

---

## 🔄 Reservation Lifecycle

```
1. CREATED (active)
   ↓
2. Patient arrives → COMPLETED
   OR
   Cancelled manually → CANCELLED
   OR
   Time expires → EXPIRED
```

### Status Definitions

| Status | Description | Bed Released? |
|--------|-------------|---------------|
| `active` | Reservation is valid | No |
| `completed` | Patient arrived & admitted | No (bed occupied) |
| `cancelled` | Manually cancelled | Yes |
| `expired` | Time limit exceeded | Yes |

---

## ⏰ Expiry System

**Expiry Time Calculation:**
```
Expiry = Current Time + ETA Minutes + 15 min buffer
```

**Example:**
- Emergency created at: 12:00 PM
- ETA to hospital: 15 minutes
- Reservation expires at: 12:30 PM (12:00 + 15 + 15)

**Auto-Cleanup:**
- Runs every 60 seconds
- Checks all active reservations
- Auto-expires and releases beds
- Logs expired reservations

---

## 🧪 Testing

### Run Complete Test

```bash
node test-bed-reservation.js
```

### Manual Testing

**1. Reserve a Bed:**
```bash
curl -X POST http://localhost:3013/api/hospitals/hospital-004/reserve-bed \
  -H "Content-Type: application/json" \
  -d '{
    "ride_request_id": "RIDE-TEST-001",
    "bed_type": "icu",
    "patient_name": "Test Patient",
    "emergency_type": "heart attack",
    "priority": "critical",
    "eta_minutes": 10,
    "requester_phone": "9876543210"
  }'
```

**2. Check Reservation:**
```bash
curl http://localhost:3013/api/reservations/RES-xxx
```

**3. Confirm Arrival:**
```bash
curl -X POST http://localhost:3013/api/reservations/RES-xxx/confirm-arrival \
  -H "Content-Type: application/json" \
  -d '{
    "confirmed_by": "Dr. Test",
    "notes": "Patient admitted successfully"
  }'
```

**4. Cancel Reservation:**
```bash
curl -X POST http://localhost:3013/api/reservations/RES-xxx/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Test cancellation"
  }'
```

---

## 📊 Usage Example

### Complete Workflow

```javascript
const axios = require('axios');

// 1. Get hospital recommendations
const recommendations = await axios.post(
  'http://localhost:3013/api/hospitals/recommend',
  {
    location: { lat: 28.6315, lng: 77.2167 },
    emergency_type: 'heart attack',
    priority: 'critical',
    bed_type: 'icu'
  }
);

const topHospital = recommendations.data.data.recommendations[0];

// 2. Reserve bed at top hospital
const reservation = await axios.post(
  `http://localhost:3013/api/hospitals/${topHospital.id}/reserve-bed`,
  {
    ride_request_id: rideId,
    bed_type: 'icu',
    patient_name: 'John Doe',
    emergency_type: 'heart attack',
    priority: 'critical',
    eta_minutes: topHospital.eta,
    requester_phone: '9876543210'
  }
);

console.log('Bed reserved:', reservation.data.reservation.id);

// 3. On patient arrival, confirm
await axios.post(
  `http://localhost:3013/api/reservations/${reservation.data.reservation.id}/confirm-arrival`,
  {
    confirmed_by: 'Dr. Smith',
    notes: 'Patient admitted to ICU'
  }
);
```

---

## 🎯 Integration Points

### With Driver Matching Service

When a driver accepts a ride with hospital recommendation:

```javascript
// In uber-style-driver-matching-service.js
if (topHospital && ride.priority === 'critical') {
  // Auto-reserve bed
  const reservation = await axios.post(
    `http://localhost:3013/api/hospitals/${topHospital.id}/reserve-bed`,
    {
      ride_request_id: rideId,
      bed_type: ride.priority === 'critical' ? 'icu' : 'emergency',
      patient_name: ride.customer.name,
      emergency_type: ride.medical_info.emergency_type,
      priority: ride.medical_info.priority,
      eta_minutes: topHospital.eta,
      requester_phone: ride.customer.phone
    }
  );
  
  ride.bed_reservation = reservation.data.reservation;
}
```

---

## 📱 Dashboard Integration

### Display Reservation in Emergency Details

```javascript
// Show reservation info
if (emergency.bed_reservation) {
  return (
    <div>
      <h4>🛏️ Bed Reserved</h4>
      <p>Hospital: {emergency.bed_reservation.hospital_name}</p>
      <p>Bed Type: {emergency.bed_reservation.bed_type}</p>
      <p>Expires: {emergency.bed_reservation.expires_at}</p>
      <button onClick={() => confirmArrival(emergency.bed_reservation.id)}>
        Confirm Arrival
      </button>
    </div>
  );
}
```

---

## 🔐 Security Considerations

1. **Authentication** (Future)
   - Only authorized users can reserve beds
   - Hospital staff verification for confirmations

2. **Rate Limiting**
   - Prevent spam reservations
   - Max reservations per user/hour

3. **Validation**
   - Verify ETA is reasonable (<60 min)
   - Ensure bed type exists
   - Check hospital capacity

---

## 📈 Metrics & Analytics

Track these metrics:

- Total reservations made
- Average time to confirmation
- Cancellation rate
- Expiry rate
- Hospital utilization
- Peak reservation times

---

## 🆘 Troubleshooting

### Reservation Failed

**Error:** "No ICU beds available"
- **Solution:** Try alternative hospitals or request general bed

**Error:** "Reservation not found"
- **Solution:** Check reservation ID, may have expired

### Bed Count Not Updated

- Check hospital service logs
- Verify reservation status
- Restart hospital service if needed

---

## 🚀 Future Enhancements

- [ ] SMS notifications to hospital on reservation
- [ ] QR code for quick check-in
- [ ] Priority queue for critical cases
- [ ] Bed type preferences
- [ ] Multi-bed reservations
- [ ] Integration with hospital management systems

---

**Bed reservations save lives by ensuring treatment readiness!** 🛏️🏥

