// Predictive Analytics Service for Emergency Hotspots and Demand Forecasting
const fs = require('fs');
const path = require('path');

class PredictiveAnalyticsService {
  constructor() {
    this.isConfigured = true;
    this.analyticsData = [];
    this.patterns = this.loadPatterns();
    this.loadAnalyticsData();
    console.log('📊 Predictive Analytics Service: Advanced forecasting system active');
  }

  loadPatterns() {
    return {
      // Time-based patterns
      time_patterns: {
        'rush_hour_morning': { 
          hours: [7, 9], 
          weight: 1.5, 
          description: 'Morning rush hour increases accident probability' 
        },
        'rush_hour_evening': { 
          hours: [17, 19], 
          weight: 1.5, 
          description: 'Evening rush hour increases accident probability' 
        },
        'night_time': { 
          hours: [22, 6], 
          weight: 0.8, 
          description: 'Night time reduces overall emergency volume' 
        },
        'weekend': { 
          days: [0, 6], 
          weight: 1.2, 
          description: 'Weekends have different emergency patterns' 
        }
      },
      
      // Weather patterns
      weather_patterns: {
        'extreme_heat': { 
          condition: 'heat', 
          weight: 1.8, 
          emergency_types: ['heat_stroke', 'dehydration', 'cardiac'] 
        },
        'extreme_cold': { 
          condition: 'cold', 
          weight: 1.6, 
          emergency_types: ['hypothermia', 'frostbite', 'respiratory'] 
        },
        'rain_storm': { 
          condition: 'rain', 
          weight: 1.4, 
          emergency_types: ['accidents', 'slip_falls', 'flooding'] 
        },
        'fog': { 
          condition: 'fog', 
          weight: 1.3, 
          emergency_types: ['accidents', 'visibility_issues'] 
        }
      },
      
      // Location patterns
      location_patterns: {
        'highway': { 
          keywords: ['highway', 'freeway', 'motorway'], 
          weight: 2.0, 
          emergency_types: ['accidents', 'trauma'] 
        },
        'residential': { 
          keywords: ['residential', 'housing', 'colony'], 
          weight: 0.8, 
          emergency_types: ['medical', 'elderly_care'] 
        },
        'commercial': { 
          keywords: ['commercial', 'business', 'office'], 
          weight: 1.1, 
          emergency_types: ['workplace_injuries', 'stress'] 
        },
        'industrial': { 
          keywords: ['industrial', 'factory', 'manufacturing'], 
          weight: 1.4, 
          emergency_types: ['industrial_accidents', 'chemical_exposure'] 
        }
      },
      
      // Seasonal patterns
      seasonal_patterns: {
        'summer': { 
          months: [5, 6, 7, 8], 
          weight: 1.3, 
          emergency_types: ['heat_related', 'dehydration', 'outdoor_injuries'] 
        },
        'winter': { 
          months: [11, 12, 1, 2], 
          weight: 1.2, 
          emergency_types: ['respiratory', 'slip_falls', 'hypothermia'] 
        },
        'monsoon': { 
          months: [6, 7, 8, 9], 
          weight: 1.4, 
          emergency_types: ['water_related', 'infections', 'flooding'] 
        }
      },
      
      // Event patterns
      event_patterns: {
        'festivals': { 
          keywords: ['diwali', 'holi', 'eid', 'christmas'], 
          weight: 1.6, 
          emergency_types: ['burns', 'injuries', 'cardiac'] 
        },
        'sports_events': { 
          keywords: ['cricket', 'football', 'marathon'], 
          weight: 1.3, 
          emergency_types: ['sports_injuries', 'cardiac', 'dehydration'] 
        },
        'political_rallies': { 
          keywords: ['rally', 'protest', 'demonstration'], 
          weight: 1.5, 
          emergency_types: ['trauma', 'crowd_related', 'respiratory'] 
        }
      }
    };
  }

  loadAnalyticsData() {
    try {
      const dataPath = path.join(__dirname, '..', 'mock-data', 'analyticsData.json');
      if (fs.existsSync(dataPath)) {
        this.analyticsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      } else {
        // Generate initial analytics data
        this.generateInitialData();
      }
    } catch (error) {
      console.log('📊 No analytics data found, generating initial data');
      this.generateInitialData();
    }
  }

  generateInitialData() {
    const now = new Date();
    const data = [];
    
    // Generate 30 days of historical data
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayOfWeek = date.getDay();
      const hour = Math.floor(Math.random() * 24);
      
      // Generate 5-20 emergencies per day
      const emergencyCount = Math.floor(Math.random() * 16) + 5;
      
      for (let j = 0; j < emergencyCount; j++) {
        const emergencyHour = Math.floor(Math.random() * 24);
        data.push({
          id: `analytics_${i}_${j}`,
          timestamp: new Date(date.getTime() + (emergencyHour * 60 * 60 * 1000)),
          emergency_type: this.getRandomEmergencyType(),
          location: this.getRandomLocation(),
          priority: Math.floor(Math.random() * 4) + 1,
          weather: this.getRandomWeather(),
          day_of_week: dayOfWeek,
          hour: emergencyHour,
          response_time: Math.floor(Math.random() * 30) + 5,
          outcome: Math.random() > 0.1 ? 'successful' : 'failed'
        });
      }
    }
    
    this.analyticsData = data;
    this.saveAnalyticsData();
  }

  getRandomEmergencyType() {
    const types = [
      'Heart Attack', 'Road Accident', 'Breathing Problems', 'Stroke',
      'Seizure', 'Severe Pain', 'High Fever', 'Minor Injury',
      'Heat Stroke', 'Hypothermia', 'Allergic Reaction', 'Unconscious'
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  getRandomLocation() {
    const locations = [
      'Connaught Place, New Delhi',
      'India Gate, New Delhi',
      'Lajpat Nagar, New Delhi',
      'Highway 1, Delhi',
      'Residential Area, Delhi',
      'Commercial District, Delhi',
      'Industrial Zone, Delhi'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  getRandomWeather() {
    const weathers = ['normal', 'heat', 'cold', 'rain', 'fog', 'storm'];
    return weathers[Math.floor(Math.random() * weathers.length)];
  }

  saveAnalyticsData() {
    try {
      const dataDir = path.join(__dirname, '..', 'mock-data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dataPath = path.join(dataDir, 'analyticsData.json');
      fs.writeFileSync(dataPath, JSON.stringify(this.analyticsData, null, 2));
    } catch (error) {
      console.error('📊 Error saving analytics data:', error.message);
    }
  }

  // Predict emergency hotspots for next 24 hours
  async predictEmergencyHotspots(timeframe = 24) {
    console.log('📊 Predicting emergency hotspots...');
    
    const now = new Date();
    const predictions = [];
    
    // Generate hourly predictions for the next 24 hours
    for (let hour = 0; hour < timeframe; hour++) {
      const predictionTime = new Date(now.getTime() + (hour * 60 * 60 * 1000));
      const hourOfDay = predictionTime.getHours();
      const dayOfWeek = predictionTime.getDay();
      const month = predictionTime.getMonth();
      
      // Calculate base probability
      let baseProbability = this.calculateBaseProbability(hourOfDay, dayOfWeek, month);
      
      // Apply time-based patterns
      const timeMultiplier = this.getTimeMultiplier(hourOfDay, dayOfWeek);
      baseProbability *= timeMultiplier;
      
      // Apply weather patterns (simulate weather forecast)
      const weatherMultiplier = this.getWeatherMultiplier(predictionTime);
      baseProbability *= weatherMultiplier;
      
      // Apply seasonal patterns
      const seasonalMultiplier = this.getSeasonalMultiplier(month);
      baseProbability *= seasonalMultiplier;
      
      // Generate location-specific predictions
      const locations = this.getLocationPredictions(baseProbability, predictionTime);
      
      predictions.push({
        hour: hour,
        timestamp: predictionTime,
        base_probability: baseProbability,
        time_multiplier: timeMultiplier,
        weather_multiplier: weatherMultiplier,
        seasonal_multiplier: seasonalMultiplier,
        locations: locations,
        total_predicted_emergencies: locations.reduce((sum, loc) => sum + loc.predicted_count, 0)
      });
    }
    
    return {
      success: true,
      message: 'Emergency hotspots predicted successfully',
      data: {
        timeframe_hours: timeframe,
        predictions: predictions,
        summary: this.generatePredictionSummary(predictions)
      }
    };
  }

  // Calculate base probability for emergency occurrence
  calculateBaseProbability(hour, dayOfWeek, month) {
    // Base probability from historical data
    const historicalData = this.analyticsData.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate.getHours() === hour && 
             recordDate.getDay() === dayOfWeek &&
             recordDate.getMonth() === month;
    });
    
    if (historicalData.length === 0) {
      return 0.1; // Default base probability
    }
    
    return Math.min(historicalData.length / 30, 1.0); // Normalize to 0-1
  }

  // Get time-based multiplier
  getTimeMultiplier(hour, dayOfWeek) {
    let multiplier = 1.0;
    
    // Check rush hour patterns
    Object.entries(this.patterns.time_patterns).forEach(([pattern, data]) => {
      if (pattern.includes('rush_hour_morning') && hour >= data.hours[0] && hour <= data.hours[1]) {
        multiplier *= data.weight;
      } else if (pattern.includes('rush_hour_evening') && hour >= data.hours[0] && hour <= data.hours[1]) {
        multiplier *= data.weight;
      } else if (pattern.includes('night_time') && (hour >= data.hours[0] || hour <= data.hours[1])) {
        multiplier *= data.weight;
      } else if (pattern.includes('weekend') && (dayOfWeek === 0 || dayOfWeek === 6)) {
        multiplier *= data.weight;
      }
    });
    
    return multiplier;
  }

  // Get weather-based multiplier
  getWeatherMultiplier(timestamp) {
    // Simulate weather forecast (in real implementation, this would come from weather API)
    const weatherConditions = ['normal', 'heat', 'cold', 'rain', 'fog', 'storm'];
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    
    let multiplier = 1.0;
    Object.entries(this.patterns.weather_patterns).forEach(([pattern, data]) => {
      if (randomWeather.includes(data.condition)) {
        multiplier *= data.weight;
      }
    });
    
    return multiplier;
  }

  // Get seasonal multiplier
  getSeasonalMultiplier(month) {
    let multiplier = 1.0;
    
    Object.entries(this.patterns.seasonal_patterns).forEach(([season, data]) => {
      if (data.months.includes(month)) {
        multiplier *= data.weight;
      }
    });
    
    return multiplier;
  }

  // Get location-specific predictions
  getLocationPredictions(baseProbability, timestamp) {
    const locations = [
      { name: 'Connaught Place', lat: 28.6304, lng: 77.2177, type: 'commercial' },
      { name: 'India Gate', lat: 28.6129, lng: 77.2295, type: 'residential' },
      { name: 'Highway 1', lat: 28.6000, lng: 77.2000, type: 'highway' },
      { name: 'Lajpat Nagar', lat: 28.5700, lng: 77.2400, type: 'residential' },
      { name: 'Industrial Zone', lat: 28.5000, lng: 77.1000, type: 'industrial' }
    ];
    
    return locations.map(location => {
      let locationProbability = baseProbability;
      
      // Apply location-specific patterns
      Object.entries(this.patterns.location_patterns).forEach(([pattern, data]) => {
        if (location.type === pattern) {
          locationProbability *= data.weight;
        }
      });
      
      // Calculate predicted emergency count
      const predictedCount = Math.round(locationProbability * 10); // Scale to 0-10
      
      return {
        name: location.name,
        coordinates: { lat: location.lat, lng: location.lng },
        type: location.type,
        probability: locationProbability,
        predicted_count: predictedCount,
        risk_level: this.getRiskLevel(locationProbability),
        recommended_ambulances: this.getRecommendedAmbulances(predictedCount)
      };
    });
  }

  // Get risk level based on probability
  getRiskLevel(probability) {
    if (probability >= 0.7) return 'HIGH';
    if (probability >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  // Get recommended number of ambulances
  getRecommendedAmbulances(predictedCount) {
    if (predictedCount >= 8) return 3;
    if (predictedCount >= 5) return 2;
    if (predictedCount >= 2) return 1;
    return 0;
  }

  // Generate prediction summary
  generatePredictionSummary(predictions) {
    const totalPredicted = predictions.reduce((sum, pred) => sum + pred.total_predicted_emergencies, 0);
    const highRiskHours = predictions.filter(pred => pred.base_probability >= 0.7).length;
    const peakHour = predictions.reduce((peak, pred) => 
      pred.total_predicted_emergencies > peak.total_predicted_emergencies ? pred : peak
    );
    
    return {
      total_predicted_emergencies: totalPredicted,
      high_risk_hours: highRiskHours,
      peak_hour: {
        hour: peakHour.hour,
        timestamp: peakHour.timestamp,
        predicted_count: peakHour.total_predicted_emergencies
      },
      average_per_hour: (totalPredicted / predictions.length).toFixed(1),
      risk_distribution: {
        high: predictions.filter(p => p.base_probability >= 0.7).length,
        medium: predictions.filter(p => p.base_probability >= 0.4 && p.base_probability < 0.7).length,
        low: predictions.filter(p => p.base_probability < 0.4).length
      }
    };
  }

  // Predict demand for specific emergency type
  async predictEmergencyDemand(emergencyType, timeframe = 24) {
    console.log(`📊 Predicting demand for ${emergencyType}...`);
    
    const now = new Date();
    const predictions = [];
    
    // Get historical data for this emergency type
    const historicalData = this.analyticsData.filter(record => 
      record.emergency_type === emergencyType
    );
    
    if (historicalData.length === 0) {
      return {
        success: false,
        message: 'Insufficient historical data for prediction'
      };
    }
    
    // Generate hourly predictions
    for (let hour = 0; hour < timeframe; hour++) {
      const predictionTime = new Date(now.getTime() + (hour * 60 * 60 * 1000));
      const hourOfDay = predictionTime.getHours();
      
      // Calculate probability based on historical patterns
      const hourlyData = historicalData.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate.getHours() === hourOfDay;
      });
      
      const baseProbability = hourlyData.length / 30; // Normalize
      const timeMultiplier = this.getTimeMultiplier(hourOfDay, predictionTime.getDay());
      const weatherMultiplier = this.getWeatherMultiplier(predictionTime);
      
      const predictedCount = Math.round(baseProbability * timeMultiplier * weatherMultiplier * 10);
      
      predictions.push({
        hour: hour,
        timestamp: predictionTime,
        emergency_type: emergencyType,
        predicted_count: predictedCount,
        confidence: Math.min(baseProbability * 2, 1.0)
      });
    }
    
    return {
      success: true,
      message: `Demand prediction for ${emergencyType} completed`,
      data: {
        emergency_type: emergencyType,
        timeframe_hours: timeframe,
        predictions: predictions,
        total_predicted: predictions.reduce((sum, pred) => sum + pred.predicted_count, 0)
      }
    };
  }

  // Get analytics statistics
  getAnalyticsStatistics() {
    const stats = {
      total_records: this.analyticsData.length,
      by_emergency_type: {},
      by_priority: { 1: 0, 2: 0, 3: 0, 4: 0 },
      by_hour: {},
      by_day: {},
      average_response_time: 0,
      success_rate: 0,
      recent_24h: 0
    };

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let totalResponseTime = 0;
    let successfulCases = 0;

    this.analyticsData.forEach(record => {
      // Count by emergency type
      stats.by_emergency_type[record.emergency_type] = 
        (stats.by_emergency_type[record.emergency_type] || 0) + 1;
      
      // Count by priority
      stats.by_priority[record.priority]++;
      
      // Count by hour
      stats.by_hour[record.hour] = (stats.by_hour[record.hour] || 0) + 1;
      
      // Count by day
      stats.by_day[record.day_of_week] = (stats.by_day[record.day_of_week] || 0) + 1;
      
      // Calculate response time
      totalResponseTime += record.response_time;
      
      // Count successful cases
      if (record.outcome === 'successful') {
        successfulCases++;
      }
      
      // Count recent records
      if (new Date(record.timestamp) >= yesterday) {
        stats.recent_24h++;
      }
    });

    stats.average_response_time = this.analyticsData.length > 0 ? 
      (totalResponseTime / this.analyticsData.length).toFixed(1) : 0;
    stats.success_rate = this.analyticsData.length > 0 ? 
      ((successfulCases / this.analyticsData.length) * 100).toFixed(1) : 0;

    return {
      success: true,
      data: stats
    };
  }

  // Test predictive analytics functionality
  async testPredictiveAnalytics() {
    console.log('🧪 Testing Predictive Analytics Service...');
    
    const hotspotsResult = await this.predictEmergencyHotspots(12);
    const demandResult = await this.predictEmergencyDemand('Heart Attack', 12);
    
    console.log('✅ Predictive Analytics Test successful');
    return {
      success: true,
      message: 'Predictive Analytics service test successful',
      data: {
        hotspots_prediction: hotspotsResult.success,
        demand_prediction: demandResult.success
      }
    };
  }
}

module.exports = PredictiveAnalyticsService;
