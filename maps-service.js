// Google Maps Service for Aapat Platform
const axios = require('axios');

// Google Maps Configuration
const googleMapsApiKey = 'your_google_maps_api_key'; // Replace with your actual API key

class MapsService {
  constructor() {
    this.isConfigured = googleMapsApiKey && googleMapsApiKey !== 'your_google_maps_api_key';
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  // Get directions between two points
  async getDirections(origin, destination, mode = 'driving') {
    if (!this.isConfigured) {
      console.log('🗺️ Maps Mock: Directions calculated');
      return {
        success: true,
        message: 'Directions calculated (mock mode)',
        data: {
          distance: '5.2 km',
          duration: '12 minutes',
          route: [
            { lat: 28.6139, lng: 77.2090 },
            { lat: 28.6149, lng: 77.2100 },
            { lat: 28.6159, lng: 77.2110 }
          ]
        }
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode: mode,
          key: googleMapsApiKey
        }
      });

      const route = response.data.routes[0];
      const leg = route.legs[0];

      return {
        success: true,
        message: 'Directions calculated successfully',
        data: {
          distance: leg.distance.text,
          duration: leg.duration.text,
          distance_value: leg.distance.value, // in meters
          duration_value: leg.duration.value, // in seconds
          route: leg.steps.map(step => ({
            lat: step.end_location.lat,
            lng: step.end_location.lng,
            instruction: step.html_instructions
          }))
        }
      };

    } catch (error) {
      console.error('Maps Error:', error);
      return {
        success: false,
        message: 'Failed to calculate directions',
        error: error.message
      };
    }
  }

  // Geocode address to coordinates
  async geocodeAddress(address) {
    if (!this.isConfigured) {
      console.log('🗺️ Maps Mock: Address geocoded');
      return {
        success: true,
        message: 'Address geocoded (mock mode)',
        data: {
          lat: 28.6139,
          lng: 77.2090,
          formatted_address: address,
          place_id: 'mock_place_id'
        }
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: address,
          key: googleMapsApiKey
        }
      });

      const result = response.data.results[0];
      const location = result.geometry.location;

      return {
        success: true,
        message: 'Address geocoded successfully',
        data: {
          lat: location.lat,
          lng: location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          address_components: result.address_components
        }
      };

    } catch (error) {
      console.error('Geocoding Error:', error);
      return {
        success: false,
        message: 'Failed to geocode address',
        error: error.message
      };
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(lat, lng) {
    if (!this.isConfigured) {
      console.log('🗺️ Maps Mock: Coordinates reverse geocoded');
      return {
        success: true,
        message: 'Coordinates reverse geocoded (mock mode)',
        data: {
          address: 'Mock Address, Delhi, India',
          formatted_address: 'Mock Address, Delhi, India',
          place_id: 'mock_place_id'
        }
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: googleMapsApiKey
        }
      });

      const result = response.data.results[0];

      return {
        success: true,
        message: 'Coordinates reverse geocoded successfully',
        data: {
          address: result.formatted_address,
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          address_components: result.address_components
        }
      };

    } catch (error) {
      console.error('Reverse Geocoding Error:', error);
      return {
        success: false,
        message: 'Failed to reverse geocode coordinates',
        error: error.message
      };
    }
  }

  // Find nearby hospitals
  async findNearbyHospitals(location, radius = 5000) {
    if (!this.isConfigured) {
      console.log('🗺️ Maps Mock: Nearby hospitals found');
      return {
        success: true,
        message: 'Nearby hospitals found (mock mode)',
        data: [
          {
            name: 'AIIMS Delhi',
            address: 'AIIMS, New Delhi',
            lat: 28.5679,
            lng: 77.2110,
            distance: '2.1 km',
            rating: 4.5,
            place_id: 'mock_hospital_1'
          },
          {
            name: 'Safdarjung Hospital',
            address: 'Safdarjung, New Delhi',
            lat: 28.5800,
            lng: 77.2200,
            distance: '3.2 km',
            rating: 4.2,
            place_id: 'mock_hospital_2'
          }
        ]
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
        params: {
          location: `${location.lat},${location.lng}`,
          radius: radius,
          type: 'hospital',
          key: googleMapsApiKey
        }
      });

      const hospitals = response.data.results.map(place => ({
        name: place.name,
        address: place.vicinity,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        distance: this.calculateDistance(location, place.geometry.location),
        rating: place.rating || 0,
        place_id: place.place_id
      }));

      return {
        success: true,
        message: 'Nearby hospitals found successfully',
        data: hospitals
      };

    } catch (error) {
      console.error('Nearby Search Error:', error);
      return {
        success: false,
        message: 'Failed to find nearby hospitals',
        error: error.message
      };
    }
  }

  // Calculate distance between two points
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLng = this.deg2rad(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return `${distance.toFixed(1)} km`;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Test maps functionality
  async testMaps() {
    console.log('🧪 Testing Maps Service...');
    
    if (!this.isConfigured) {
      console.log('⚠️  Google Maps not configured, using mock mode');
      return { success: true, message: 'Maps service ready (mock mode)' };
    }

    try {
      // Test geocoding
      const geocodeResult = await this.geocodeAddress('Delhi, India');
      console.log('✅ Geocoding Test:', geocodeResult.success ? 'Success' : 'Failed');

      // Test directions
      const directionsResult = await this.getDirections(
        { lat: 28.6139, lng: 77.2090 },
        { lat: 28.6149, lng: 77.2100 }
      );
      console.log('✅ Directions Test:', directionsResult.success ? 'Success' : 'Failed');

      return {
        success: true,
        message: 'Maps test successful',
        geocoding: geocodeResult.success,
        directions: directionsResult.success
      };

    } catch (error) {
      console.error('❌ Maps Test failed:', error.message);
      return {
        success: false,
        message: 'Maps test failed',
        error: error.message
      };
    }
  }
}

module.exports = MapsService;
