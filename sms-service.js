// Twilio SMS Service for Aapat Platform
const twilio = require('twilio');

// Twilio Configuration
const accountSid = 'ACa4cc047c52d3f093275ff9144c4ec351';
const authToken = 'fcc0e7431199c26382f30bc3a0ccda22';
const twilioPhoneNumber = '+16674463150'; // Real Twilio number

// Twilio is now fully configured with real credentials

// Initialize Twilio client
const client = twilio(accountSid, authToken);

class SMSService {
  constructor() {
    this.isConfigured = accountSid && authToken && twilioPhoneNumber;
  }

  // Send emergency SMS to patient's emergency contacts
  async sendEmergencySMS(emergencyData) {
    if (!this.isConfigured) {
      console.log('📱 SMS Mock: Emergency alert sent to contacts');
      return { success: true, message: 'SMS sent (mock mode)' };
    }

    try {
      const message = `🚨 EMERGENCY ALERT 🚨

Emergency Type: ${emergencyData.emergency_type}
Patient: ${emergencyData.patient_info?.name || 'Unknown'}
Location: ${emergencyData.address}
Time: ${new Date().toLocaleString()}

Ambulance has been dispatched. ETA: ${emergencyData.estimated_arrival || '5-10 minutes'}

Please contact emergency services if needed.
- Aapat Emergency Services`;

      // Send to emergency contacts (mock for now)
      const emergencyContacts = [
        '+919876543210', // Mock contact 1
        '+919876543211', // Mock contact 2
        '+919876543212'  // Mock contact 3
      ];

      const results = [];
      for (const contact of emergencyContacts) {
        try {
          const result = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: contact
          });
          results.push({ contact, status: 'sent', sid: result.sid });
        } catch (error) {
          results.push({ contact, status: 'failed', error: error.message });
        }
      }

      return {
        success: true,
        message: 'Emergency SMS sent to contacts',
        results: results
      };

    } catch (error) {
      console.error('SMS Error:', error);
      return {
        success: false,
        message: 'Failed to send emergency SMS',
        error: error.message
      };
    }
  }

  // Send ambulance assignment SMS to driver
  async sendDriverAssignmentSMS(driverData, emergencyData) {
    if (!this.isConfigured) {
      console.log('📱 SMS Mock: Driver assignment sent');
      return { success: true, message: 'SMS sent (mock mode)' };
    }

    try {
      const message = `🚑 NEW EMERGENCY ASSIGNMENT

Emergency Type: ${emergencyData.emergency_type}
Patient: ${emergencyData.patient_info?.name || 'Unknown'}
Location: ${emergencyData.address}
Priority: ${emergencyData.priority_level}

Please accept or decline this assignment.
- Aapat Dispatch System`;

      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: driverData.phone
      });

      return {
        success: true,
        message: 'Driver assignment SMS sent',
        sid: result.sid
      };

    } catch (error) {
      console.error('SMS Error:', error);
      return {
        success: false,
        message: 'Failed to send driver assignment SMS',
        error: error.message
      };
    }
  }

  // Send status update SMS to patient
  async sendStatusUpdateSMS(patientPhone, status, details) {
    if (!this.isConfigured) {
      console.log('📱 SMS Mock: Status update sent');
      return { success: true, message: 'SMS sent (mock mode)' };
    }

    try {
      const message = `📱 Aapat Status Update

Status: ${status}
Details: ${details}
Time: ${new Date().toLocaleString()}

Thank you for using Aapat Emergency Services.`;

      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: patientPhone
      });

      return {
        success: true,
        message: 'Status update SMS sent',
        sid: result.sid
      };

    } catch (error) {
      console.error('SMS Error:', error);
      return {
        success: false,
        message: 'Failed to send status update SMS',
        error: error.message
      };
    }
  }

  // Send hospital notification SMS
  async sendHospitalNotificationSMS(hospitalData, emergencyData) {
    if (!this.isConfigured) {
      console.log('📱 SMS Mock: Hospital notification sent');
      return { success: true, message: 'SMS sent (mock mode)' };
    }

    try {
      const message = `🏥 INCOMING PATIENT ALERT

Patient: ${emergencyData.patient_info?.name || 'Unknown'}
Emergency Type: ${emergencyData.emergency_type}
Priority: ${emergencyData.priority_level}
ETA: ${emergencyData.estimated_arrival || '5-10 minutes'}

Please prepare bed and medical team.
- Aapat Emergency Services`;

      const result = await client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: hospitalData.contact_phone
      });

      return {
        success: true,
        message: 'Hospital notification SMS sent',
        sid: result.sid
      };

    } catch (error) {
      console.error('SMS Error:', error);
      return {
        success: false,
        message: 'Failed to send hospital notification SMS',
        error: error.message
      };
    }
  }

  // Test SMS functionality
  async testSMS() {
    console.log('🧪 Testing SMS Service...');
    
    if (!this.isConfigured) {
      console.log('⚠️  Twilio not configured, using mock mode');
      return { success: true, message: 'SMS service ready (mock mode)' };
    }

    try {
      // Test with a simple message
      const result = await client.messages.create({
        body: '🧪 Aapat SMS Test - Service is working!',
        from: twilioPhoneNumber,
        to: '+919876543210' // Test number
      });

      console.log('✅ SMS Test successful:', result.sid);
      return {
        success: true,
        message: 'SMS test successful',
        sid: result.sid
      };

    } catch (error) {
      console.error('❌ SMS Test failed:', error.message);
      
      // Check if it's an authentication error
      if (error.code === 20003 || error.message.includes('Authenticate')) {
        return {
          success: false,
          message: 'SMS authentication failed - please check Twilio credentials',
          error: 'Authentication failed. Please verify your Twilio Account SID and Auth Token.',
          suggestion: 'Visit https://console.twilio.com/ to verify your credentials'
        };
      }
      
      return {
        success: false,
        message: 'SMS test failed',
        error: error.message
      };
    }
  }
}

module.exports = SMSService;
