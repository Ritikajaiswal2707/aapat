// Enhanced SMS Service with Data Storage and Realistic Behavior
const fs = require('fs');
const path = require('path');

class EnhancedSMSService {
  constructor() {
    this.isConfigured = false; // Always use mock mode for testing
    this.smsHistory = [];
    this.messageTemplates = this.loadMessageTemplates();
    this.loadSMSHistory();
    console.log('📱 Enhanced SMS Service: Running in MOCK MODE with data storage');
  }

  loadMessageTemplates() {
    return {
      EMERGENCY_ALERT: {
        template: `🚨 EMERGENCY ALERT 🚨

Emergency Type: {emergency_type}
Patient: {patient_name}
Location: {address}
Time: {timestamp}

Ambulance has been dispatched. ETA: {eta}
Driver: {driver_name} ({ambulance_plate})

Please contact emergency services if needed.
- Aapat Emergency Services`,
        priority: 'HIGH'
      },
      DRIVER_ASSIGNMENT: {
        template: `🚑 NEW EMERGENCY ASSIGNMENT

Emergency Type: {emergency_type}
Patient: {patient_name}
Location: {address}
Priority: {priority}

Please accept or decline this assignment.
- Aapat Dispatch System`,
        priority: 'HIGH'
      },
      STATUS_UPDATE: {
        template: `📱 Aapat Status Update

Status: {status}
{details}
Time: {timestamp}

Thank you for using Aapat Emergency Services.`,
        priority: 'MEDIUM'
      },
      HOSPITAL_NOTIFICATION: {
        template: `🏥 INCOMING PATIENT ALERT

Patient: {patient_name}
Emergency Type: {emergency_type}
Priority: {priority}
ETA: {eta}

Please prepare bed and medical team.
- Aapat Emergency Services`,
        priority: 'HIGH'
      },
      PAYMENT_REMINDER: {
        template: `💳 Payment Reminder

Amount: ₹{amount}
Emergency: {emergency_type}
Payment Method: {payment_method}

Please complete payment for emergency services.
- Aapat Billing`,
        priority: 'LOW'
      }
    };
  }

  loadSMSHistory() {
    try {
      const dataPath = path.join(__dirname, '..', 'mock-data', 'smsHistory.json');
      if (fs.existsSync(dataPath)) {
        this.smsHistory = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      }
    } catch (error) {
      console.log('📱 No existing SMS history found, starting fresh');
      this.smsHistory = [];
    }
  }

  saveSMSHistory() {
    try {
      const dataDir = path.join(__dirname, '..', 'mock-data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dataPath = path.join(dataDir, 'smsHistory.json');
      fs.writeFileSync(dataPath, JSON.stringify(this.smsHistory, null, 2));
    } catch (error) {
      console.error('📱 Error saving SMS history:', error.message);
    }
  }

  formatMessage(template, variables) {
    let message = template;
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), variables[key] || 'N/A');
    });
    return message;
  }

  async sendEmergencySMS(emergencyData) {
    console.log('📱 Enhanced SMS Mock: Emergency alert sent to contacts');
    
    const variables = {
      emergency_type: emergencyData.emergency_type || 'Emergency',
      patient_name: emergencyData.patient_info?.name || 'Unknown',
      address: emergencyData.address || 'Unknown Location',
      timestamp: new Date().toLocaleString(),
      eta: emergencyData.estimated_arrival || '5-10 minutes',
      driver_name: emergencyData.driver_name || 'Driver',
      ambulance_plate: emergencyData.ambulance_plate || 'AMB-001',
      priority: emergencyData.priority_level || 1
    };

    const message = this.formatMessage(this.messageTemplates.EMERGENCY_ALERT.template, variables);
    
    // Send to emergency contacts
    const emergencyContacts = emergencyData.emergency_contacts || [
      '+919876543210',
      '+919876543211',
      '+919876543212'
    ];

    const results = [];
    for (const contact of emergencyContacts) {
      const smsRecord = {
        id: 'sms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        to: contact,
        message: message,
        status: 'SENT',
        sent_at: new Date(),
        type: 'EMERGENCY_ALERT',
        priority: 'HIGH',
        emergency_id: emergencyData.emergency_id
      };

      this.smsHistory.push(smsRecord);
      results.push({ contact, status: 'sent', sid: smsRecord.id });
    }

    this.saveSMSHistory();

    return {
      success: true,
      message: 'Emergency SMS sent to contacts (Enhanced Mock Mode)',
      results: results,
      total_sent: results.length
    };
  }

  async sendDriverAssignmentSMS(driverData, emergencyData) {
    console.log('📱 Enhanced SMS Mock: Driver assignment sent');
    
    const variables = {
      emergency_type: emergencyData.emergency_type || 'Emergency',
      patient_name: emergencyData.patient_info?.name || 'Unknown',
      address: emergencyData.address || 'Unknown Location',
      priority: emergencyData.priority_level || 1
    };

    const message = this.formatMessage(this.messageTemplates.DRIVER_ASSIGNMENT.template, variables);
    
    const smsRecord = {
      id: 'sms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      to: driverData.phone,
      message: message,
      status: 'SENT',
      sent_at: new Date(),
      type: 'DRIVER_ASSIGNMENT',
      priority: 'HIGH',
      driver_id: driverData.id,
      emergency_id: emergencyData.emergency_id
    };

    this.smsHistory.push(smsRecord);
    this.saveSMSHistory();

    return {
      success: true,
      message: 'Driver assignment SMS sent (Enhanced Mock Mode)',
      sid: smsRecord.id,
      driver_phone: driverData.phone
    };
  }

  async sendStatusUpdateSMS(patientPhone, status, details) {
    console.log('📱 Enhanced SMS Mock: Status update sent');
    
    const variables = {
      status: status,
      details: details || 'No additional details',
      timestamp: new Date().toLocaleString()
    };

    const message = this.formatMessage(this.messageTemplates.STATUS_UPDATE.template, variables);
    
    const smsRecord = {
      id: 'sms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      to: patientPhone,
      message: message,
      status: 'SENT',
      sent_at: new Date(),
      type: 'STATUS_UPDATE',
      priority: 'MEDIUM'
    };

    this.smsHistory.push(smsRecord);
    this.saveSMSHistory();

    return {
      success: true,
      message: 'Status update SMS sent (Enhanced Mock Mode)',
      sid: smsRecord.id
    };
  }

  async sendHospitalNotificationSMS(hospitalData, emergencyData) {
    console.log('📱 Enhanced SMS Mock: Hospital notification sent');
    
    const variables = {
      patient_name: emergencyData.patient_info?.name || 'Unknown',
      emergency_type: emergencyData.emergency_type || 'Emergency',
      priority: emergencyData.priority_level || 1,
      eta: emergencyData.estimated_arrival || '5-10 minutes'
    };

    const message = this.formatMessage(this.messageTemplates.HOSPITAL_NOTIFICATION.template, variables);
    
    const smsRecord = {
      id: 'sms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      to: hospitalData.contact_phone,
      message: message,
      status: 'SENT',
      sent_at: new Date(),
      type: 'HOSPITAL_NOTIFICATION',
      priority: 'HIGH',
      hospital_id: hospitalData.id,
      emergency_id: emergencyData.emergency_id
    };

    this.smsHistory.push(smsRecord);
    this.saveSMSHistory();

    return {
      success: true,
      message: 'Hospital notification SMS sent (Enhanced Mock Mode)',
      sid: smsRecord.id
    };
  }

  async sendPaymentReminderSMS(patientPhone, paymentData) {
    console.log('📱 Enhanced SMS Mock: Payment reminder sent');
    
    const variables = {
      amount: paymentData.amount,
      emergency_type: paymentData.emergency_type || 'Emergency',
      payment_method: paymentData.payment_method || 'Online'
    };

    const message = this.formatMessage(this.messageTemplates.PAYMENT_REMINDER.template, variables);
    
    const smsRecord = {
      id: 'sms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      to: patientPhone,
      message: message,
      status: 'SENT',
      sent_at: new Date(),
      type: 'PAYMENT_REMINDER',
      priority: 'LOW',
      payment_id: paymentData.payment_id
    };

    this.smsHistory.push(smsRecord);
    this.saveSMSHistory();

    return {
      success: true,
      message: 'Payment reminder SMS sent (Enhanced Mock Mode)',
      sid: smsRecord.id
    };
  }

  // Get SMS history
  getSMSHistory(filters = {}) {
    let filteredHistory = [...this.smsHistory];

    if (filters.type) {
      filteredHistory = filteredHistory.filter(sms => sms.type === filters.type);
    }

    if (filters.phone) {
      filteredHistory = filteredHistory.filter(sms => sms.to === filters.phone);
    }

    if (filters.priority) {
      filteredHistory = filteredHistory.filter(sms => sms.priority === filters.priority);
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      filteredHistory = filteredHistory.filter(sms => new Date(sms.sent_at) >= fromDate);
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      filteredHistory = filteredHistory.filter(sms => new Date(sms.sent_at) <= toDate);
    }

    return {
      success: true,
      data: filteredHistory,
      total: filteredHistory.length,
      filters: filters
    };
  }

  // Get SMS statistics
  getSMSStatistics() {
    const stats = {
      total_sms: this.smsHistory.length,
      by_type: {},
      by_priority: {},
      by_status: {},
      recent_24h: 0
    };

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    this.smsHistory.forEach(sms => {
      // Count by type
      stats.by_type[sms.type] = (stats.by_type[sms.type] || 0) + 1;
      
      // Count by priority
      stats.by_priority[sms.priority] = (stats.by_priority[sms.priority] || 0) + 1;
      
      // Count by status
      stats.by_status[sms.status] = (stats.by_status[sms.status] || 0) + 1;
      
      // Count recent messages
      if (new Date(sms.sent_at) >= yesterday) {
        stats.recent_24h++;
      }
    });

    return {
      success: true,
      data: stats
    };
  }

  // Test SMS functionality
  async testSMS() {
    console.log('🧪 Testing Enhanced SMS Service...');
    
    const testResult = await this.sendEmergencySMS({
      emergency_type: 'Heart Attack',
      patient_info: { name: 'Test Patient' },
      address: 'Test Location',
      estimated_arrival: '5 minutes',
      emergency_contacts: ['+919876543210']
    });

    console.log('✅ Enhanced SMS Test successful:', testResult.message);
    return {
      success: true,
      message: 'Enhanced SMS service test successful',
      data: testResult
    };
  }
}

module.exports = EnhancedSMSService;
