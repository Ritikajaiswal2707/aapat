# 🚀 Start Here - Aapat Emergency System

## Quick Start (3 Steps)

### Step 1: Start All Services
```bash
node start-complete-system.js
```

### Step 2: Open Dashboard
```
http://localhost:3000
```

### Step 3: Test the System
```bash
# In another terminal
node test-hospital-integration.js
```

---

## What You'll See

### 1. Dashboard Features
- **Overview Tab**: Key metrics and recent emergencies
- **Emergencies Tab**: Manage all emergency requests
- **Ambulance Booking Tab**: Uber-style ride management
- **Hospitals Tab**: View all hospitals and bed availability

### 2. Create Test Emergency
- Click **"Create Test Emergency"** button
- Automatic driver assignment
- **View hospital recommendations** in emergency details

### 3. Hospital Recommendations
Click "Details" on any emergency to see:
- ⭐ Top recommended hospital
- 📍 Distance & ETA
- 🛏️ Bed availability
- ✅ Specialty & equipment match
- Score (0-100)

---

## System Components

| Service | Port | Status Check |
|---------|------|--------------|
| Dashboard | 3000 | http://localhost:3000 |
| Driver Matching | 3012 | http://localhost:3012/health |
| Hospital Matching | 3013 | http://localhost:3013/health |

---

## Quick Test

### Test Hospital Integration
```bash
node test-hospital-integration.js
```

**Expected Output:**
```
✅ Hospital Service: OK (8 hospitals)
✅ Cardiac Emergency Recommendations
✅ Trauma Emergency Recommendations
✅ Ride Request with Hospital Recommendations
```

---

## Need Help?

### Documentation
- **[SYSTEM_STATUS.md](./SYSTEM_STATUS.md)** - Complete system status
- **[HOSPITAL_INTEGRATION_GUIDE.md](./HOSPITAL_INTEGRATION_GUIDE.md)** - Hospital integration details
- **[README.md](./README.md)** - Full documentation

### Common Issues

**Services Won't Start:**
```bash
# Check for running processes
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3012"
netstat -ano | findstr ":3013"

# Kill if needed
Stop-Process -Id <PID> -Force
```

**Dashboard Not Loading:**
```bash
# Rebuild frontend
cd frontend
npm run build
cd ..
node serve-dashboard-simple.js
```

---

## Features at a Glance

✅ **Uber-Style Ambulance Booking**
- Real-time driver matching
- OTP verification
- Payment integration

✅ **Intelligent Hospital Matching** (NEW!)
- Automatic recommendations
- Multi-factor scoring
- 8 Delhi hospitals
- Real-time bed availability

✅ **Real-time Dashboard**
- Live metrics
- Emergency management
- Driver fleet tracking
- Hospital capacity monitoring

---

**Ready to save lives!** 🚑🏥❤️

