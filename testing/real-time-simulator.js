// Real-time Simulator for Aapat Platform
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class RealTimeSimulator extends EventEmitter {
  constructor() {
    super();
    this.ambulances = new Map();
    this.emergencies = new Map();
    this.isRunning = false;
    this.simulationSpeed = 1000; // 1 second = 1 minute in simulation
    this.loadMockData();
  }

  loadMockData() {
    try {
      const dataPath = path.join(__dirname, '..', 'mock-data', 'ambulances.json');
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        data.forEach(ambulance => {
          this.ambulances.set(ambulance.id, {
            ...ambulance,
            current_lat: ambulance.lat,
            current_lng: ambulance.lng,
            target_lat: null,
            target_lng: null,
            is_moving: false,
            speed: 0, // km/h
            last_update: new Date()
          });
        });
      }
    } catch (error) {
      console.log('🚑 No ambulance data found, using default data');
    }
  }

  // Start simulation
  start() {
    if (this.isRunning) {
      console.log('⚠️ Simulation is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting real-time simulation...');
    console.log(`⏱️ Simulation speed: ${this.simulationSpeed}ms = 1 minute`);
    
    this.simulationInterval = setInterval(() => {
      this.updateSimulation();
    }, this.simulationInterval);

    this.emit('simulation_started');
  }

  // Stop simulation
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Simulation is not running');
      return;
    }

    this.isRunning = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    
    console.log('🛑 Simulation stopped');
    this.emit('simulation_stopped');
  }

  // Update simulation state
  updateSimulation() {
    const now = new Date();
    
    // Update each ambulance
    this.ambulances.forEach((ambulance, id) => {
      this.updateAmbulance(ambulance, now);
    });

    // Update emergencies
    this.emergencies.forEach((emergency, id) => {
      this.updateEmergency(emergency, now);
    });

    this.emit('simulation_updated', {
      ambulances: Array.from(this.ambulances.values()),
      emergencies: Array.from(this.emergencies.values()),
      timestamp: now
    });
  }

  // Update individual ambulance
  updateAmbulance(ambulance, now) {
    if (!ambulance.is_moving || !ambulance.target_lat || !ambulance.target_lng) {
      return;
    }

    // Calculate movement
    const distance = this.calculateDistance(
      { lat: ambulance.current_lat, lng: ambulance.current_lng },
      { lat: ambulance.target_lat, lng: ambulance.target_lng }
    );

    if (distance < 0.1) { // Arrived at destination
      ambulance.current_lat = ambulance.target_lat;
      ambulance.current_lng = ambulance.target_lng;
      ambulance.is_moving = false;
      ambulance.speed = 0;
      ambulance.target_lat = null;
      ambulance.target_lng = null;
      
      this.emit('ambulance_arrived', {
        ambulance_id: ambulance.id,
        location: { lat: ambulance.current_lat, lng: ambulance.current_lng },
        timestamp: now
      });
    } else {
      // Move towards target
      const speed = ambulance.speed || 30; // km/h
      const timeElapsed = (now - ambulance.last_update) / 1000; // seconds
      const distanceMoved = (speed * timeElapsed) / 3600; // km
      
      if (distanceMoved > 0) {
        const ratio = Math.min(distanceMoved / distance, 1);
        ambulance.current_lat += (ambulance.target_lat - ambulance.current_lat) * ratio;
        ambulance.current_lng += (ambulance.target_lng - ambulance.current_lng) * ratio;
        ambulance.last_update = now;
        
        this.emit('ambulance_moved', {
          ambulance_id: ambulance.id,
          location: { lat: ambulance.current_lat, lng: ambulance.current_lng },
          speed: speed,
          timestamp: now
        });
      }
    }
  }

  // Update emergency status
  updateEmergency(emergency, now) {
    const timeElapsed = (now - emergency.created_at) / 1000; // seconds
    
    // Update status based on time
    if (emergency.status === 'PENDING' && timeElapsed > 60) {
      emergency.status = 'ASSIGNED';
      this.emit('emergency_assigned', emergency);
    } else if (emergency.status === 'ASSIGNED' && timeElapsed > 300) {
      emergency.status = 'DISPATCHED';
      this.emit('emergency_dispatched', emergency);
    } else if (emergency.status === 'DISPATCHED' && timeElapsed > 600) {
      emergency.status = 'AMBULANCE_ARRIVED';
      this.emit('emergency_ambulance_arrived', emergency);
    } else if (emergency.status === 'AMBULANCE_ARRIVED' && timeElapsed > 900) {
      emergency.status = 'EN_ROUTE_TO_HOSPITAL';
      this.emit('emergency_en_route', emergency);
    } else if (emergency.status === 'EN_ROUTE_TO_HOSPITAL' && timeElapsed > 1200) {
      emergency.status = 'ARRIVED_AT_HOSPITAL';
      this.emit('emergency_arrived_at_hospital', emergency);
    }
  }

  // Calculate distance between two points
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Dispatch ambulance to emergency
  dispatchAmbulance(ambulanceId, emergencyId, destination) {
    const ambulance = this.ambulances.get(ambulanceId);
    if (!ambulance) {
      throw new Error(`Ambulance ${ambulanceId} not found`);
    }

    // Set target location
    ambulance.target_lat = destination.lat;
    ambulance.target_lng = destination.lng;
    ambulance.is_moving = true;
    ambulance.speed = 30 + Math.random() * 20; // 30-50 km/h
    ambulance.status = 'ON_DUTY';
    ambulance.last_update = new Date();

    // Create emergency record
    const emergency = {
      id: emergencyId,
      ambulance_id: ambulanceId,
      status: 'DISPATCHED',
      created_at: new Date(),
      destination: destination,
      patient_info: {
        name: 'Simulated Patient',
        phone: '+91-98765-00000'
      }
    };
    this.emergencies.set(emergencyId, emergency);

    this.emit('ambulance_dispatched', {
      ambulance_id: ambulanceId,
      emergency_id: emergencyId,
      destination: destination,
      timestamp: new Date()
    });

    return {
      success: true,
      ambulance_id: ambulanceId,
      emergency_id: emergencyId,
      eta_minutes: Math.round(this.calculateDistance(
        { lat: ambulance.current_lat, lng: ambulance.current_lng },
        destination
      ) * 2) // Rough ETA calculation
    };
  }

  // Get ambulance status
  getAmbulanceStatus(ambulanceId) {
    const ambulance = this.ambulances.get(ambulanceId);
    if (!ambulance) {
      return null;
    }

    return {
      id: ambulance.id,
      plate_number: ambulance.plate_number,
      status: ambulance.status,
      location: {
        lat: ambulance.current_lat,
        lng: ambulance.current_lng
      },
      is_moving: ambulance.is_moving,
      speed: ambulance.speed,
      target: ambulance.target_lat ? {
        lat: ambulance.target_lat,
        lng: ambulance.target_lng
      } : null,
      last_update: ambulance.last_update
    };
  }

  // Get all ambulances status
  getAllAmbulancesStatus() {
    const statuses = [];
    this.ambulances.forEach((ambulance, id) => {
      statuses.push(this.getAmbulanceStatus(id));
    });
    return statuses;
  }

  // Get emergency status
  getEmergencyStatus(emergencyId) {
    const emergency = this.emergencies.get(emergencyId);
    if (!emergency) {
      return null;
    }

    return {
      id: emergency.id,
      status: emergency.status,
      ambulance_id: emergency.ambulance_id,
      created_at: emergency.created_at,
      destination: emergency.destination,
      patient_info: emergency.patient_info
    };
  }

  // Get all emergencies status
  getAllEmergenciesStatus() {
    const statuses = [];
    this.emergencies.forEach((emergency, id) => {
      statuses.push(this.getEmergencyStatus(id));
    });
    return statuses;
  }

  // Simulate random emergency
  simulateRandomEmergency() {
    const emergencyTypes = ['Heart Attack', 'Road Accident', 'Breathing Problems', 'Stroke', 'Seizure'];
    const locations = [
      { lat: 28.6139, lng: 77.2090, name: 'Connaught Place' },
      { lat: 28.6129, lng: 77.2295, name: 'India Gate' },
      { lat: 28.5700, lng: 77.2400, name: 'Lajpat Nagar' },
      { lat: 28.5200, lng: 77.1800, name: 'Vasant Kunj' },
      { lat: 28.5400, lng: 77.2000, name: 'Saket' }
    ];

    const emergencyType = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const emergencyId = 'emergency_' + Date.now();

    const emergency = {
      id: emergencyId,
      type: emergencyType,
      location: location,
      status: 'PENDING',
      created_at: new Date(),
      priority: Math.floor(Math.random() * 4) + 1
    };

    this.emergencies.set(emergencyId, emergency);

    this.emit('emergency_created', emergency);

    return emergency;
  }

  // Find nearest available ambulance
  findNearestAmbulance(location) {
    let nearest = null;
    let minDistance = Infinity;

    this.ambulances.forEach((ambulance, id) => {
      if (ambulance.status === 'AVAILABLE') {
        const distance = this.calculateDistance(
          { lat: ambulance.current_lat, lng: ambulance.current_lng },
          location
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearest = ambulance;
        }
      }
    });

    return nearest;
  }

  // Auto-dispatch nearest ambulance
  autoDispatchNearestAmbulance(emergencyId, destination) {
    const nearest = this.findNearestAmbulance(destination);
    if (!nearest) {
      return {
        success: false,
        message: 'No available ambulances found'
      };
    }

    return this.dispatchAmbulance(nearest.id, emergencyId, destination);
  }

  // Get simulation statistics
  getSimulationStatistics() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = {
      total_ambulances: this.ambulances.size,
      available_ambulances: 0,
      on_duty_ambulances: 0,
      total_emergencies: this.emergencies.size,
      active_emergencies: 0,
      completed_emergencies: 0,
      recent_emergencies: 0,
      average_response_time: 0
    };

    // Count ambulance statuses
    this.ambulances.forEach(ambulance => {
      if (ambulance.status === 'AVAILABLE') {
        stats.available_ambulances++;
      } else if (ambulance.status === 'ON_DUTY') {
        stats.on_duty_ambulances++;
      }
    });

    // Count emergency statuses
    this.emergencies.forEach(emergency => {
      if (emergency.status === 'PENDING' || emergency.status === 'ASSIGNED' || 
          emergency.status === 'DISPATCHED' || emergency.status === 'AMBULANCE_ARRIVED' ||
          emergency.status === 'EN_ROUTE_TO_HOSPITAL') {
        stats.active_emergencies++;
      } else if (emergency.status === 'ARRIVED_AT_HOSPITAL') {
        stats.completed_emergencies++;
      }

      if (emergency.created_at >= last24h) {
        stats.recent_emergencies++;
      }
    });

    return stats;
  }

  // Start demo simulation
  startDemo() {
    console.log('🎬 Starting Demo Simulation...');
    
    this.start();

    // Simulate random emergencies every 30 seconds
    this.emergencyInterval = setInterval(() => {
      const emergency = this.simulateRandomEmergency();
      console.log(`🚨 New emergency: ${emergency.type} at ${emergency.location.name}`);
      
      // Auto-dispatch nearest ambulance
      const dispatch = this.autoDispatchNearestAmbulance(emergency.id, emergency.location);
      if (dispatch.success) {
        console.log(`🚑 Ambulance ${dispatch.ambulance_id} dispatched to ${emergency.location.name}`);
      } else {
        console.log(`❌ No available ambulances for ${emergency.type}`);
      }
    }, 30000); // 30 seconds

    // Print statistics every minute
    this.statsInterval = setInterval(() => {
      const stats = this.getSimulationStatistics();
      console.log(`\n📊 Simulation Stats:`);
      console.log(`   Available Ambulances: ${stats.available_ambulances}`);
      console.log(`   On Duty Ambulances: ${stats.on_duty_ambulances}`);
      console.log(`   Active Emergencies: ${stats.active_emergencies}`);
      console.log(`   Recent Emergencies (24h): ${stats.recent_emergencies}`);
    }, 60000); // 1 minute
  }

  // Stop demo simulation
  stopDemo() {
    this.stop();
    
    if (this.emergencyInterval) {
      clearInterval(this.emergencyInterval);
    }
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    
    console.log('🛑 Demo simulation stopped');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  const simulator = new RealTimeSimulator();
  
  // Set up event listeners
  simulator.on('emergency_created', (emergency) => {
    console.log(`🚨 Emergency created: ${emergency.type} at ${emergency.location.name}`);
  });

  simulator.on('ambulance_dispatched', (data) => {
    console.log(`🚑 Ambulance ${data.ambulance_id} dispatched to emergency ${data.emergency_id}`);
  });

  simulator.on('ambulance_arrived', (data) => {
    console.log(`✅ Ambulance ${data.ambulance_id} arrived at destination`);
  });

  simulator.on('emergency_ambulance_arrived', (emergency) => {
    console.log(`🏥 Ambulance arrived for emergency ${emergency.id}`);
  });

  // Start demo
  simulator.startDemo();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down simulation...');
    simulator.stopDemo();
    process.exit(0);
  });
}

module.exports = RealTimeSimulator;
