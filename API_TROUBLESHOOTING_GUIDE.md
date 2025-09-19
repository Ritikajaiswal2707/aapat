# 🔧 Aapat Platform - API Troubleshooting Guide

## 📊 **Current Status**
✅ **Working:** Internet connectivity  
❌ **Issues:** Twilio, Razorpay, RapidAPI

---

## 🚨 **Issue #1: Twilio Authentication Error**

**Error:** `Authenticate`

**Possible Causes:**
1. **Account SID or Auth Token is incorrect**
2. **Account is suspended or inactive**
3. **Credentials are from a different environment (trial vs live)**

**Solutions:**
1. **Verify credentials in Twilio Console:**
   - Go to https://console.twilio.com/
   - Check Account SID and Auth Token
   - Ensure account is active

2. **Test with Twilio CLI:**
   ```bash
   npm install -g twilio-cli
   twilio login
   twilio phone-numbers:list
   ```

3. **Check account status:**
   - Ensure account is not suspended
   - Verify billing is set up (if using live credentials)

---

## 🚨 **Issue #2: Razorpay Error**

**Error:** `undefined`

**Possible Causes:**
1. **API keys are incorrect**
2. **Account is not activated**
3. **Keys are from test environment but trying to use live features**

**Solutions:**
1. **Verify API keys in Razorpay Dashboard:**
   - Go to https://dashboard.razorpay.com/
   - Navigate to Settings > API Keys
   - Copy the correct Key ID and Key Secret

2. **Test with Razorpay API:**
   ```bash
   curl -u rzp_test_RFghxBO5zdCwb:c4kCtdCxSaNBZmJvcQWZL2LY \
   https://api.razorpay.com/v1/orders \
   -X POST \
   -d "amount=100&currency=INR&receipt=test_001"
   ```

---

## 🚨 **Issue #3: RapidAPI Subscription**

**Error:** `You are not subscribed to this API`

**Solution:**
1. **Subscribe to Google Maps Places API:**
   - Visit: https://rapidapi.com/googlecloud/api/google-map-places-new-v2
   - Click "Subscribe to Test" or "Subscribe to Basic"
   - Choose a plan (Basic plan is usually free for testing)

2. **Alternative: Use Direct Google Maps API:**
   - Get API key from: https://console.cloud.google.com/
   - Enable Places API, Geocoding API, Directions API
   - Use direct Google Maps API instead of RapidAPI

---

## 🔄 **Quick Fixes**

### **Option 1: Fix Current APIs**
1. **Twilio:** Verify credentials in console
2. **Razorpay:** Check API keys in dashboard  
3. **RapidAPI:** Subscribe to Google Maps Places API

### **Option 2: Use Alternative Services**
1. **Maps:** Use direct Google Maps API
2. **SMS:** Use alternative SMS service (AWS SNS, SendGrid)
3. **Payments:** Use alternative payment gateway (Stripe, PayPal)

---

## 🧪 **Test Individual Services**

### **Test Twilio Only:**
```bash
node -e "
const twilio = require('twilio');
const client = twilio('ACa4cc047c52d3f093275ff9144c4ec351', 'fcc0e7431199c26382f30bc3a0ccda22');
client.api.accounts('ACa4cc047c52d3f093275ff9144c4ec351').fetch()
  .then(account => console.log('✅ Twilio:', account.friendlyName))
  .catch(err => console.log('❌ Twilio:', err.message));
"
```

### **Test Razorpay Only:**
```bash
node -e "
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: 'rzp_test_RFghxBO5zdCwb',
  key_secret: 'c4kCtdCxSaNBZmJvcQWZL2LY'
});
razorpay.orders.create({amount: 100, currency: 'INR', receipt: 'test'})
  .then(order => console.log('✅ Razorpay:', order.id))
  .catch(err => console.log('❌ Razorpay:', err.message));
"
```

---

## 🎯 **Recommended Next Steps**

1. **Immediate:** Subscribe to RapidAPI Google Maps Places API
2. **Verify:** Twilio credentials in console
3. **Check:** Razorpay API keys in dashboard
4. **Test:** Run `node test-api-simple.js` again

## 📞 **Need Help?**

- **Twilio Support:** https://support.twilio.com/
- **Razorpay Support:** https://razorpay.com/support/
- **RapidAPI Support:** https://rapidapi.com/support/

---

## 🚀 **Alternative Setup (If Issues Persist)**

If you continue having issues, I can help you set up alternative services:

1. **Google Maps Direct API** (instead of RapidAPI)
2. **AWS SNS** (instead of Twilio)
3. **Stripe** (instead of Razorpay)

Let me know which approach you'd prefer!
