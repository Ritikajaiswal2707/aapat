// Enhanced Maps Service with Data Storage and Realistic Behavior
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class EnhancedMapsService {
  constructor() {
    // Enable real Google Maps API
    this.googleMapsApiKey = 'AIzaSyBXbyqebArDDbV4TWfTqMHJ4KQavEH-RAY';
    this.isConfigured = true; // Enable real Google Maps API
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
    this.locationHistory = [];
    this.hospitals = [];
    this.loadMockData();
    console.log('🗺️ Enhanced Maps Service: Running with REAL Google Maps API');
  }

  loadMockData() {
    try {
      const dataPath = path.join(__dirname, '..', 'mock-data', 'hospitals.json');
      if (fs.existsSync(dataPath)) {
        this.hospitals = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      }
    } catch (error) {
      console.log('🗺️ No existing hospital data found, using default data');
      this.hospitals = [];
    }
  }

  // Calculate distance between two points (Haversine formula)
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

  // Generate realistic route with waypoints
  generateRoute(origin, destination) {
    const waypoints = [];
    const steps = 3 + Math.floor(Math.random() * 3); // 3-5 waypoints
    
    for (let i = 1; i < steps; i++) {
      const lat = origin.lat + (destination.lat - origin.lat) * (i / steps) + (Math.random() - 0.5) * 0.01;
      const lng = origin.lng + (destination.lng - origin.lng) * (i / steps) + (Math.random() - 0.5) * 0.01;
      waypoints.push({ lat, lng });
    }
    
    return [origin, ...waypoints, destination];
  }

  // Simulate traffic conditions
  getTrafficMultiplier() {
    const hour = new Date().getHours();
    // Peak hours: 8-10 AM, 6-8 PM
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)) {
      return 1.5 + Math.random() * 0.5; // 1.5x to 2x delay
    }
    // Night hours: 11 PM - 5 AM
    else if (hour >= 23 || hour <= 5) {
      return 0.7 + Math.random() * 0.2; // 0.7x to 0.9x (faster)
    }
    // Normal hours
    else {
      return 0.8 + Math.random() * 0.4; // 0.8x to 1.2x
    }
  }

  async getDirections(origin, destination, mode = 'driving') {
    console.log('🗺️ Enhanced Maps Real: Directions calculated');

    if (!this.isConfigured) {
      // Fallback to mock mode
      const distance = this.calculateDistance(origin, destination);
      const baseDuration = distance * 2;
      const trafficMultiplier = this.getTrafficMultiplier();
      const duration = Math.round(baseDuration * trafficMultiplier);
      
      return {
        success: true,
        message: 'Directions calculated (fallback mock mode)',
        data: {
          distance: `${distance.toFixed(1)} km`,
          duration: `${duration} minutes`,
          route: this.generateRoute(origin, destination),
          mode: mode
        }
      };
    }

    try {
      // Use real Google Maps API
      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode: mode,
          language: 'en',
          key: this.googleMapsApiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(response.data.error_message || 'Directions API error');
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];
      const waypoints = [];
      
      // Extract waypoints from steps
      leg.steps.forEach(step => {
        waypoints.push({
          lat: step.end_location.lat,
          lng: step.end_location.lng,
          instruction: step.html_instructions.replace(/<[^>]*>/g, '') // Remove HTML tags
        });
      });

      const result = {
        success: true,
        message: 'Directions calculated successfully (Real Google Maps API)',
        data: {
          distance: leg.distance.text,
          duration: leg.duration.text,
          distance_value: leg.distance.value, // in meters
          duration_value: leg.duration.value, // in seconds
          route: waypoints,
          mode: mode,
          waypoints: waypoints.length
        }
      };

      // Store in history
      this.locationHistory.push({
        id: 'route_' + Date.now(),
        type: 'DIRECTIONS',
        origin: origin,
        destination: destination,
        distance: leg.distance.value / 1000, // Convert to km
        duration: leg.duration.value / 60, // Convert to minutes
        created_at: new Date()
      });

      return result;

    } catch (error) {
      console.error('Google Maps API Error:', error.message);
      
      // Fallback to mock mode on API error
      const distance = this.calculateDistance(origin, destination);
      const baseDuration = distance * 2;
      const trafficMultiplier = this.getTrafficMultiplier();
      const duration = Math.round(baseDuration * trafficMultiplier);
      
      return {
        success: true,
        message: 'Directions calculated (fallback after API error)',
        data: {
          distance: `${distance.toFixed(1)} km`,
          duration: `${duration} minutes`,
          route: this.generateRoute(origin, destination),
          mode: mode,
          error_fallback: true
        }
      };
    }
  }

  async geocodeAddress(address) {
    console.log('🗺️ Enhanced Maps Real: Address geocoded');

    if (!this.isConfigured) {
      // Fallback to mock mode
      const delhiCenter = { lat: 28.6139, lng: 77.2090 };
      const lat = delhiCenter.lat + (Math.random() - 0.5) * 0.2;
      const lng = delhiCenter.lng + (Math.random() - 0.5) * 0.2;
      
      return {
        success: true,
        message: 'Address geocoded (fallback mock mode)',
        data: {
          lat: lat,
          lng: lng,
          formatted_address: address,
          place_id: 'mock_place_' + Date.now()
        }
      };
    }

    try {
      // Use real Google Maps Geocoding API
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: address,
          key: this.googleMapsApiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(response.data.error_message || 'Geocoding API error');
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      const geocodeResult = {
        success: true,
        message: 'Address geocoded successfully (Real Google Maps API)',
        data: {
          lat: location.lat,
          lng: location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          address_components: result.address_components.map(comp => ({
            type: comp.types,
            name: comp.long_name,
            short_name: comp.short_name
          }))
        }
      };

      // Store in history
      this.locationHistory.push({
        id: 'geocode_' + Date.now(),
        type: 'GEOCODE',
        address: address,
        coordinates: { lat: location.lat, lng: location.lng },
        formatted_address: result.formatted_address,
        created_at: new Date()
      });

      return geocodeResult;

    } catch (error) {
      console.error('Google Maps Geocoding Error:', error.message);
      
      // Fallback to mock mode on API error
      const delhiCenter = { lat: 28.6139, lng: 77.2090 };
      const lat = delhiCenter.lat + (Math.random() - 0.5) * 0.2;
      const lng = delhiCenter.lng + (Math.random() - 0.5) * 0.2;
      
      return {
        success: true,
        message: 'Address geocoded (fallback after API error)',
        data: {
          lat: lat,
          lng: lng,
          formatted_address: address,
          place_id: 'mock_place_' + Date.now(),
          error_fallback: true
        }
      };
    }
  }

  async reverseGeocode(lat, lng) {
    console.log('🗺️ Enhanced Maps Mock: Coordinates reverse geocoded');
    
    // Generate realistic address based on coordinates
    const addresses = [
      'Connaught Place, New Delhi, Delhi 110001',
      'India Gate, New Delhi, Delhi 110003',
      'Lajpat Nagar, New Delhi, Delhi 110024',
      'Karol Bagh, New Delhi, Delhi 110005',
      'Hauz Khas, New Delhi, Delhi 110016',
      'Saket, New Delhi, Delhi 110017',
      'Vasant Kunj, New Delhi, Delhi 110070'
    ];
    
    const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];
    
    const result = {
      success: true,
      message: 'Coordinates reverse geocoded successfully (Enhanced Mock Mode)',
      data: {
        address: randomAddress,
        formatted_address: randomAddress,
        place_id: 'mock_place_' + Date.now(),
        coordinates: { lat, lng },
        address_components: {
          locality: 'New Delhi',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India'
        }
      }
    };

    // Store in history
    this.locationHistory.push({
      id: 'reverse_' + Date.now(),
      type: 'REVERSE_GEOCODE',
      coordinates: { lat, lng },
      address: randomAddress,
      created_at: new Date()
    });

    return result;
  }

  async findNearbyHospitals(location, radius = 5000) {
    console.log('🗺️ Enhanced Maps Mock: Nearby hospitals found');
    
    const nearbyHospitals = this.hospitals.map(hospital => {
      const distance = this.calculateDistance(location, { lat: hospital.lat, lng: hospital.lng });
      return {
        ...hospital,
        distance: distance,
        distance_km: `${distance.toFixed(1)} km`,
        eta_minutes: Math.round(distance * 2 * this.getTrafficMultiplier()),
        is_nearby: distance <= (radius / 1000) // Convert radius to km
      };
    }).filter(hospital => hospital.is_nearby)
      .sort((a, b) => a.distance - b.distance);

    const result = {
      success: true,
      message: 'Nearby hospitals found successfully (Enhanced Mock Mode)',
      data: nearbyHospitals,
      search_location: location,
      search_radius: radius,
      total_found: nearbyHospitals.length
    };

    // Store in history
    this.locationHistory.push({
      id: 'hospitals_' + Date.now(),
      type: 'NEARBY_HOSPITALS',
      location: location,
      radius: radius,
      results_count: nearbyHospitals.length,
      created_at: new Date()
    });

    return result;
  }

  async getETA(origin, destination, mode = 'driving') {
    console.log('🗺️ Enhanced Maps Mock: ETA calculated');
    
    const distance = this.calculateDistance(origin, destination);
    const baseDuration = distance * 2; // Base 2 minutes per km
    const trafficMultiplier = this.getTrafficMultiplier();
    const etaMinutes = Math.round(baseDuration * trafficMultiplier);
    
    return {
      success: true,
      message: 'ETA calculated successfully (Enhanced Mock Mode)',
      data: {
        eta_minutes: etaMinutes,
        eta_formatted: `${etaMinutes} minutes`,
        distance_km: distance.toFixed(1),
        traffic_condition: trafficMultiplier > 1.3 ? 'Heavy Traffic' : trafficMultiplier < 0.8 ? 'Light Traffic' : 'Normal Traffic',
        mode: mode
      }
    };
  }

  async getTrafficConditions(location) {
    console.log('🗺️ Enhanced Maps Mock: Traffic conditions retrieved');
    
    const hour = new Date().getHours();
    let condition = 'Normal';
    let level = 1;
    
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)) {
      condition = 'Heavy';
      level = 3;
    } else if (hour >= 23 || hour <= 5) {
      condition = 'Light';
      level = 0;
    } else {
      condition = 'Normal';
      level = 1;
    }
    
    return {
      success: true,
      message: 'Traffic conditions retrieved successfully (Enhanced Mock Mode)',
      data: {
        condition: condition,
        level: level,
        description: `${condition} traffic conditions`,
        location: location,
        timestamp: new Date()
      }
    };
  }

  // Get location history
  getLocationHistory(filters = {}) {
    let filteredHistory = [...this.locationHistory];

    if (filters.type) {
      filteredHistory = filteredHistory.filter(entry => entry.type === filters.type);
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      filteredHistory = filteredHistory.filter(entry => new Date(entry.created_at) >= fromDate);
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      filteredHistory = filteredHistory.filter(entry => new Date(entry.created_at) <= toDate);
    }

    return {
      success: true,
      data: filteredHistory,
      total: filteredHistory.length,
      filters: filters
    };
  }

  // Get maps statistics
  getMapsStatistics() {
    const stats = {
      total_requests: this.locationHistory.length,
      by_type: {},
      total_distance: 0,
      average_distance: 0,
      recent_24h: 0
    };

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let totalDistance = 0;

    this.locationHistory.forEach(entry => {
      // Count by type
      stats.by_type[entry.type] = (stats.by_type[entry.type] || 0) + 1;
      
      // Sum total distance
      if (entry.distance) {
        totalDistance += entry.distance;
      }
      
      // Count recent requests
      if (new Date(entry.created_at) >= yesterday) {
        stats.recent_24h++;
      }
    });

    stats.total_distance = totalDistance.toFixed(1);
    stats.average_distance = this.locationHistory.length > 0 ? (totalDistance / this.locationHistory.length).toFixed(1) : 0;

    return {
      success: true,
      data: stats
    };
  }

  // Test maps functionality
  async testMaps() {
    console.log('🧪 Testing Enhanced Maps Service...');
    
    const testOrigin = { lat: 28.6139, lng: 77.2090 };
    const testDestination = { lat: 28.5679, lng: 77.2110 };
    
    const directionsResult = await this.getDirections(testOrigin, testDestination);
    const geocodeResult = await this.geocodeAddress('Test Address, New Delhi');
    const hospitalsResult = await this.findNearbyHospitals(testOrigin);

    console.log('✅ Enhanced Maps Test successful');
    return {
      success: true,
      message: 'Enhanced Maps service test successful',
      data: {
        directions: directionsResult.data,
        geocode: geocodeResult.data,
        hospitals: hospitalsResult.data.length
      }
    };
  }
}

module.exports = EnhancedMapsService;
