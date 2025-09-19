# 🚀 RapidAPI Google Maps Setup Guide

## ✅ **Your RapidAPI Configuration**

You already have a working RapidAPI key! Here's your configuration:

```env
# RapidAPI Google Maps Places
RAPIDAPI_KEY=960c7ab24amsh311ecec7c41e63cp183660jsn012f10980c13
RAPIDAPI_HOST=google-map-places-new-v2.p.rapidapi.com
```

## 🔧 **Update Your .env File**

Add these lines to your `.env` file:

```env
# RapidAPI Google Maps Places
RAPIDAPI_KEY=960c7ab24amsh311ecec7c41e63cp183660jsn012f10980c13
RAPIDAPI_HOST=google-map-places-new-v2.p.rapidapi.com
```

## 🧪 **Test Your Setup**

Run the test script to verify everything works:

```bash
node test-api-keys.js
```

## 📋 **What This Enables**

Your RapidAPI key provides access to:
- **Places Autocomplete** - Find hospitals, clinics, pharmacies
- **Place Details** - Get detailed information about medical facilities
- **Nearby Search** - Find closest emergency services
- **Geocoding** - Convert addresses to coordinates

## 🎯 **API Usage Examples**

### Find Nearby Hospitals
```javascript
const response = await axios.post('https://google-map-places-new-v2.p.rapidapi.com/v1/places:autocomplete', {
  input: "Hospital",
  locationBias: {
    circle: {
      center: { latitude: 28.6139, longitude: 77.2090 },
      radius: 10000
    }
  },
  includedPrimaryTypes: ["hospital"],
  includedRegionCodes: ["IN"]
}, {
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-FieldMask': '*',
    'x-rapidapi-host': 'google-map-places-new-v2.p.rapidapi.com',
    'x-rapidapi-key': '960c7ab24amsh311ecec7c41e63cp183660jsn012f10980c13'
  }
});
```

## 🚀 **Next Steps**

1. Update your `.env` file with the RapidAPI configuration
2. Run `node test-api-keys.js` to test all services
3. Your Aapat platform is now ready for production!

## 📊 **Current Status**

✅ **Working Services:**
- Twilio (SMS/Voice)
- Razorpay (Payments)
- PostgreSQL (Database)
- Redis (Caching)
- RapidAPI (Maps/Places)

❌ **Still Needed:**
- Firebase (Push Notifications) - Optional for basic functionality
