// Wearable Device Integration Service for Automatic Emergency Detection
const EventEmitter = require('events');

class WearableIntegrationService extends EventEmitter {
  constructor() {
    super();
    this.isConfigured = true;
    this.connectedDevices = new Map();
    this.emergencyThresholds = this.loadEmergencyThresholds();
    this.deviceHistory = [];
    console.log('⌚ Wearable Integration Service: Smart device monitoring active');
  }

  loadEmergencyThresholds() {
    return {
      // Heart rate thresholds (BPM)
      heart_rate: {
        critical_high: 180,
        high: 150,
        normal_high: 100,
        normal_low: 60,
        low: 40,
        critical_low: 30
      },
      
      // Blood pressure thresholds (mmHg)
      blood_pressure: {
        systolic: {
          critical_high: 200,
          high: 160,
          normal_high: 140,
          normal_low: 90,
          low: 70,
          critical_low: 50
        },
        diastolic: {
          critical_high: 120,
          high: 100,
          normal_high: 90,
          normal_low: 60,
          low: 40,
          critical_low: 30
        }
      },
      
      // Oxygen saturation thresholds (%)
      oxygen_saturation: {
        critical_low: 85,
        low: 90,
        normal_low: 95,
        normal_high: 100
      },
      
      // Temperature thresholds (°C)
      temperature: {
        critical_high: 40,
        high: 38.5,
        normal_high: 37.5,
        normal_low: 36.5,
        low: 35,
        critical_low: 32
      },
      
      // Fall detection thresholds
      fall_detection: {
        acceleration_threshold: 2.5, // g-force
        impact_duration: 200, // milliseconds
        orientation_change: 45 // degrees
      },
      
      // Seizure detection thresholds
      seizure_detection: {
        movement_frequency: 10, // movements per second
        irregular_pattern_duration: 30, // seconds
        eeg_abnormality_threshold: 0.8
      }
    };
  }

  // Register a wearable device
  registerDevice(deviceData) {
    const deviceId = deviceData.device_id || 'device_' + Date.now();
    
    const device = {
      id: deviceId,
      type: deviceData.type || 'smartwatch',
      user_id: deviceData.user_id,
      user_name: deviceData.user_name,
      capabilities: deviceData.capabilities || ['heart_rate', 'fall_detection'],
      status: 'connected',
      last_seen: new Date(),
      battery_level: deviceData.battery_level || 100,
      location: deviceData.location || null,
      emergency_contacts: deviceData.emergency_contacts || [],
      medical_history: deviceData.medical_history || [],
      is_active: true
    };

    this.connectedDevices.set(deviceId, device);
    
    console.log(`⌚ Device registered: ${device.type} for ${device.user_name}`);
    
    // Start monitoring this device
    this.startDeviceMonitoring(deviceId);
    
    return {
      success: true,
      message: 'Device registered successfully',
      data: {
        device_id: deviceId,
        status: 'connected',
        capabilities: device.capabilities
      }
    };
  }

  // Start monitoring a device
  startDeviceMonitoring(deviceId) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    // Simulate real-time data monitoring
    const monitoringInterval = setInterval(() => {
      if (!device.is_active) {
        clearInterval(monitoringInterval);
        return;
      }

      // Generate simulated sensor data
      const sensorData = this.generateSensorData(device);
      
      // Process the data for emergency detection
      this.processSensorData(deviceId, sensorData);
      
      // Update device last seen
      device.last_seen = new Date();
      
    }, 5000); // Check every 5 seconds

    device.monitoring_interval = monitoringInterval;
    
    return {
      success: true,
      message: 'Device monitoring started',
      data: { device_id: deviceId }
    };
  }

  // Generate simulated sensor data
  generateSensorData(device) {
    const now = new Date();
    const data = {
      timestamp: now,
      device_id: device.id,
      user_id: device.user_id,
      battery_level: Math.max(0, device.battery_level - Math.random() * 0.1),
      location: device.location
    };

    // Generate heart rate data
    if (device.capabilities.includes('heart_rate')) {
      data.heart_rate = this.generateHeartRateData(device);
    }

    // Generate blood pressure data
    if (device.capabilities.includes('blood_pressure')) {
      data.blood_pressure = this.generateBloodPressureData(device);
    }

    // Generate oxygen saturation data
    if (device.capabilities.includes('oxygen_saturation')) {
      data.oxygen_saturation = this.generateOxygenSaturationData(device);
    }

    // Generate temperature data
    if (device.capabilities.includes('temperature')) {
      data.temperature = this.generateTemperatureData(device);
    }

    // Generate movement data
    if (device.capabilities.includes('fall_detection')) {
      data.movement = this.generateMovementData(device);
    }

    // Generate EEG data for seizure detection
    if (device.capabilities.includes('seizure_detection')) {
      data.eeg_data = this.generateEEGData(device);
    }

    return data;
  }

  // Generate heart rate data with realistic patterns
  generateHeartRateData(device) {
    const baseRate = 70 + Math.random() * 20; // 70-90 BPM base
    const variation = Math.random() * 10; // ±5 BPM variation
    
    // Simulate occasional spikes (exercise, stress, emergency)
    const spikeProbability = 0.05; // 5% chance of spike
    if (Math.random() < spikeProbability) {
      return Math.round(baseRate + variation + (Math.random() * 50 + 30)); // 30-80 BPM spike
    }
    
    return Math.round(baseRate + variation);
  }

  // Generate blood pressure data
  generateBloodPressureData(device) {
    const baseSystolic = 120 + Math.random() * 20; // 120-140 mmHg
    const baseDiastolic = 80 + Math.random() * 10; // 80-90 mmHg
    
    return {
      systolic: Math.round(baseSystolic),
      diastolic: Math.round(baseDiastolic)
    };
  }

  // Generate oxygen saturation data
  generateOxygenSaturationData(device) {
    const baseO2 = 98 + Math.random() * 2; // 98-100%
    return Math.round(baseO2 * 10) / 10; // Round to 1 decimal
  }

  // Generate temperature data
  generateTemperatureData(device) {
    const baseTemp = 36.5 + Math.random() * 1; // 36.5-37.5°C
    return Math.round(baseTemp * 10) / 10; // Round to 1 decimal
  }

  // Generate movement data for fall detection
  generateMovementData(device) {
    return {
      acceleration_x: (Math.random() - 0.5) * 2, // -1 to 1 g
      acceleration_y: (Math.random() - 0.5) * 2,
      acceleration_z: (Math.random() - 0.5) * 2,
      gyroscope_x: (Math.random() - 0.5) * 10,
      gyroscope_y: (Math.random() - 0.5) * 10,
      gyroscope_z: (Math.random() - 0.5) * 10,
      orientation: Math.random() * 360
    };
  }

  // Generate EEG data for seizure detection
  generateEEGData(device) {
    const channels = ['F3', 'F4', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2'];
    const eegData = {};
    
    channels.forEach(channel => {
      eegData[channel] = {
        amplitude: (Math.random() - 0.5) * 100, // -50 to 50 μV
        frequency: 8 + Math.random() * 12, // 8-20 Hz
        phase: Math.random() * 2 * Math.PI
      };
    });
    
    return eegData;
  }

  // Process sensor data for emergency detection
  processSensorData(deviceId, sensorData) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) return;

    const alerts = [];
    let emergencyDetected = false;

    // Check heart rate
    if (sensorData.heart_rate) {
      const hrAlert = this.checkHeartRateAlert(sensorData.heart_rate, device);
      if (hrAlert) {
        alerts.push(hrAlert);
        if (hrAlert.severity === 'critical') emergencyDetected = true;
      }
    }

    // Check blood pressure
    if (sensorData.blood_pressure) {
      const bpAlert = this.checkBloodPressureAlert(sensorData.blood_pressure, device);
      if (bpAlert) {
        alerts.push(bpAlert);
        if (bpAlert.severity === 'critical') emergencyDetected = true;
      }
    }

    // Check oxygen saturation
    if (sensorData.oxygen_saturation) {
      const o2Alert = this.checkOxygenSaturationAlert(sensorData.oxygen_saturation, device);
      if (o2Alert) {
        alerts.push(o2Alert);
        if (o2Alert.severity === 'critical') emergencyDetected = true;
      }
    }

    // Check temperature
    if (sensorData.temperature) {
      const tempAlert = this.checkTemperatureAlert(sensorData.temperature, device);
      if (tempAlert) {
        alerts.push(tempAlert);
        if (tempAlert.severity === 'critical') emergencyDetected = true;
      }
    }

    // Check fall detection
    if (sensorData.movement) {
      const fallAlert = this.checkFallDetection(sensorData.movement, device);
      if (fallAlert) {
        alerts.push(fallAlert);
        emergencyDetected = true;
      }
    }

    // Check seizure detection
    if (sensorData.eeg_data) {
      const seizureAlert = this.checkSeizureDetection(sensorData.eeg_data, device);
      if (seizureAlert) {
        alerts.push(seizureAlert);
        emergencyDetected = true;
      }
    }

    // Store device history
    this.deviceHistory.push({
      device_id: deviceId,
      timestamp: sensorData.timestamp,
      sensor_data: sensorData,
      alerts: alerts,
      emergency_detected: emergencyDetected
    });

    // Emit alerts
    if (alerts.length > 0) {
      this.emit('device_alert', {
        device_id: deviceId,
        user_name: device.user_name,
        alerts: alerts,
        timestamp: sensorData.timestamp
      });
    }

    // Emit emergency if detected
    if (emergencyDetected) {
      this.emit('emergency_detected', {
        device_id: deviceId,
        user_name: device.user_name,
        emergency_type: this.determineEmergencyType(alerts),
        location: device.location,
        emergency_contacts: device.emergency_contacts,
        medical_history: device.medical_history,
        sensor_data: sensorData,
        timestamp: sensorData.timestamp
      });
    }
  }

  // Check heart rate alerts
  checkHeartRateAlert(heartRate, device) {
    const thresholds = this.emergencyThresholds.heart_rate;
    
    if (heartRate >= thresholds.critical_high) {
      return {
        type: 'heart_rate',
        severity: 'critical',
        message: `Critical high heart rate: ${heartRate} BPM`,
        value: heartRate,
        threshold: thresholds.critical_high
      };
    } else if (heartRate <= thresholds.critical_low) {
      return {
        type: 'heart_rate',
        severity: 'critical',
        message: `Critical low heart rate: ${heartRate} BPM`,
        value: heartRate,
        threshold: thresholds.critical_low
      };
    } else if (heartRate >= thresholds.high || heartRate <= thresholds.low) {
      return {
        type: 'heart_rate',
        severity: 'warning',
        message: `Abnormal heart rate: ${heartRate} BPM`,
        value: heartRate,
        threshold: heartRate >= thresholds.high ? thresholds.high : thresholds.low
      };
    }
    
    return null;
  }

  // Check blood pressure alerts
  checkBloodPressureAlert(bloodPressure, device) {
    const thresholds = this.emergencyThresholds.blood_pressure;
    const { systolic, diastolic } = bloodPressure;
    
    if (systolic >= thresholds.systolic.critical_high || diastolic >= thresholds.diastolic.critical_high) {
      return {
        type: 'blood_pressure',
        severity: 'critical',
        message: `Critical high blood pressure: ${systolic}/${diastolic} mmHg`,
        value: bloodPressure,
        threshold: thresholds.systolic.critical_high
      };
    } else if (systolic <= thresholds.systolic.critical_low || diastolic <= thresholds.diastolic.critical_low) {
      return {
        type: 'blood_pressure',
        severity: 'critical',
        message: `Critical low blood pressure: ${systolic}/${diastolic} mmHg`,
        value: bloodPressure,
        threshold: thresholds.systolic.critical_low
      };
    }
    
    return null;
  }

  // Check oxygen saturation alerts
  checkOxygenSaturationAlert(oxygenSaturation, device) {
    const thresholds = this.emergencyThresholds.oxygen_saturation;
    
    if (oxygenSaturation <= thresholds.critical_low) {
      return {
        type: 'oxygen_saturation',
        severity: 'critical',
        message: `Critical low oxygen saturation: ${oxygenSaturation}%`,
        value: oxygenSaturation,
        threshold: thresholds.critical_low
      };
    } else if (oxygenSaturation <= thresholds.low) {
      return {
        type: 'oxygen_saturation',
        severity: 'warning',
        message: `Low oxygen saturation: ${oxygenSaturation}%`,
        value: oxygenSaturation,
        threshold: thresholds.low
      };
    }
    
    return null;
  }

  // Check temperature alerts
  checkTemperatureAlert(temperature, device) {
    const thresholds = this.emergencyThresholds.temperature;
    
    if (temperature >= thresholds.critical_high) {
      return {
        type: 'temperature',
        severity: 'critical',
        message: `Critical high temperature: ${temperature}°C`,
        value: temperature,
        threshold: thresholds.critical_high
      };
    } else if (temperature <= thresholds.critical_low) {
      return {
        type: 'temperature',
        severity: 'critical',
        message: `Critical low temperature: ${temperature}°C`,
        value: temperature,
        threshold: thresholds.critical_low
      };
    }
    
    return null;
  }

  // Check fall detection
  checkFallDetection(movement, device) {
    const thresholds = this.emergencyThresholds.fall_detection;
    const acceleration = Math.sqrt(
      movement.acceleration_x ** 2 + 
      movement.acceleration_y ** 2 + 
      movement.acceleration_z ** 2
    );
    
    if (acceleration >= thresholds.acceleration_threshold) {
      return {
        type: 'fall_detection',
        severity: 'critical',
        message: 'Fall detected - possible injury',
        value: acceleration,
        threshold: thresholds.acceleration_threshold,
        movement_data: movement
      };
    }
    
    return null;
  }

  // Check seizure detection
  checkSeizureDetection(eegData, device) {
    const thresholds = this.emergencyThresholds.seizure_detection;
    
    // Analyze EEG patterns for seizure indicators
    const channels = Object.keys(eegData);
    let abnormalChannels = 0;
    
    channels.forEach(channel => {
      const channelData = eegData[channel];
      if (channelData.frequency > 20 || channelData.frequency < 4) {
        abnormalChannels++;
      }
    });
    
    if (abnormalChannels >= channels.length * 0.5) {
      return {
        type: 'seizure_detection',
        severity: 'critical',
        message: 'Possible seizure detected',
        value: abnormalChannels,
        threshold: channels.length * 0.5,
        eeg_data: eegData
      };
    }
    
    return null;
  }

  // Determine emergency type from alerts
  determineEmergencyType(alerts) {
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
    
    if (criticalAlerts.some(alert => alert.type === 'heart_rate')) {
      return 'Heart Attack';
    } else if (criticalAlerts.some(alert => alert.type === 'fall_detection')) {
      return 'Fall/Injury';
    } else if (criticalAlerts.some(alert => alert.type === 'seizure_detection')) {
      return 'Seizure';
    } else if (criticalAlerts.some(alert => alert.type === 'oxygen_saturation')) {
      return 'Breathing Problems';
    } else if (criticalAlerts.some(alert => alert.type === 'blood_pressure')) {
      return 'Cardiovascular Emergency';
    } else {
      return 'Medical Emergency';
    }
  }

  // Get device status
  getDeviceStatus(deviceId) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    return {
      success: true,
      data: {
        device_id: deviceId,
        status: device.status,
        battery_level: device.battery_level,
        last_seen: device.last_seen,
        capabilities: device.capabilities,
        is_active: device.is_active
      }
    };
  }

  // Get all connected devices
  getAllDevices() {
    const devices = Array.from(this.connectedDevices.values());
    return {
      success: true,
      data: {
        total_devices: devices.length,
        active_devices: devices.filter(d => d.is_active).length,
        devices: devices.map(device => ({
          id: device.id,
          type: device.type,
          user_name: device.user_name,
          status: device.status,
          battery_level: device.battery_level,
          last_seen: device.last_seen,
          capabilities: device.capabilities
        }))
      }
    };
  }

  // Get device history
  getDeviceHistory(deviceId, hours = 24) {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const history = this.deviceHistory.filter(record => 
      record.device_id === deviceId && 
      new Date(record.timestamp) >= cutoffTime
    );

    return {
      success: true,
      data: {
        device_id: deviceId,
        hours: hours,
        records: history.length,
        history: history
      }
    };
  }

  // Disconnect device
  disconnectDevice(deviceId) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    // Stop monitoring
    if (device.monitoring_interval) {
      clearInterval(device.monitoring_interval);
    }

    device.is_active = false;
    device.status = 'disconnected';

    console.log(`⌚ Device disconnected: ${device.type} for ${device.user_name}`);

    return {
      success: true,
      message: 'Device disconnected successfully',
      data: { device_id: deviceId }
    };
  }

  // Test wearable integration
  async testWearableIntegration() {
    console.log('🧪 Testing Wearable Integration Service...');
    
    // Register a test device
    const deviceResult = this.registerDevice({
      device_id: 'test_device_001',
      type: 'smartwatch',
      user_id: 'user_001',
      user_name: 'Test User',
      capabilities: ['heart_rate', 'fall_detection', 'blood_pressure'],
      emergency_contacts: ['+91-98765-12345'],
      medical_history: ['hypertension']
    });

    console.log('✅ Wearable Integration Test successful');
    return {
      success: true,
      message: 'Wearable Integration service test successful',
      data: deviceResult
    };
  }
}

module.exports = WearableIntegrationService;
