import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  landmark?: string;
  formatted_address?: string;
  locality?: string;
  city?: string;
  pincode?: string;
  state?: string;
  country?: string;
}

export interface LocationPermissionStatus {
  granted: boolean;
  status: Location.LocationPermissionResponse;
}

class LocationService {
  private static readonly DEFAULT_CITY = 'Delhi';
  private static readonly DEFAULT_STATE = 'Delhi';
  private static readonly DEFAULT_COUNTRY = 'India';

  /**
   * Request location permissions from user
   */
  static async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to continue.',
          [{ text: 'OK' }]
        );
        return { granted: false, status: null };
      }

      // Check current permissions
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        // Request permission
        const permissionResult = await Location.requestForegroundPermissionsAsync();
        
        if (permissionResult.status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Location permission is required to find nearby ambulances. Please grant permission in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Location.openSettingsAsync() }
            ]
          );
          return { granted: false, status: permissionResult };
        }
        
        status = permissionResult.status;
      }

      return { 
        granted: status === 'granted', 
        status: { status, canAskAgain: true, expires: 'never' } 
      };
    } catch (error: any) {
      console.error('Location permission error:', error.message);
      Alert.alert('Location Error', 'Failed to request location permissions.');
      return { granted: false, status: null };
    }
  }

  /**
   * Get current user location
   */
  static async getCurrentLocation(): Promise<LocationData> {
    try {
      // Request permissions first
      const permissionCheck = await this.requestLocationPermission();
      if (!permissionCheck.granted) {
        throw new Error('Location permission not granted');
      }

      // Get current position
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });

      const { latitude, longitude } = locationResult.coords;

      // Reverse geocode to get address
      const addressComponents = await this.reverseGeocode(latitude, longitude);

      return {
        address: addressComponents.formatted_address || 'Current Location',
        lat: latitude,
        lng: longitude,
        formatted_address: addressComponents.formatted_address,
        locality: addressComponents.locality,
        city: addressComponents.city,
        pincode: addressComponents.pincode
      };
    } catch (error: any) {
      console.error('Get current location error:', error.message);
      throw new Error(`Failed to get current location: ${error.message}`);
    }
  }

  /**
   * Watch location updates
   */
  static async watchLocation(
    onLocationUpdate: (location: LocationData) => void,
    onError: (error: string) => void
  ): Promise<Location.LocationSubscription> {
    try {
      const permissionCheck = await this.requestLocationPermission();
      if (!permissionCheck.granted) {
        onError('Location permission not granted');
        return null;
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (locationResult) => {
          try {
            const { latitude, longitude } = locationResult.coords;
            const addressComponents = await this.reverseGeocode(latitude, longitude);

            onLocationUpdate({
              address: addressComponents.formatted_address || 'Current Location',
              lat: latitude,
              lng: longitude,
              formatted_address: addressComponents.formatted_address,
              locality: addressComponents.locality,
              city: addressComponents.city,
              pincode: addressComponents.pincode
            });
          } catch (error: any) {
            onError(`Location update failed: ${error.message}`);
          }
        }
      );
    } catch (error: any) {
      console.error('Watch location error:', error.message);
      onError(`Failed to watch location: ${error.message}`);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  static async reverseGeocode(lat: number, lng: number): Promise<LocationData> {
    try {
      const reverseGeocodeResult = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (reverseGeocodeResult.length === 0) {
        throw new Error('No address found for coordinates');
      }

      const address = reverseGeocodeResult[0];
      
      // Build formatted address
      const addressParts = [];
      if (address.name) addressParts.push(address.name);
      if (address.street) addressParts.push(address.street);
      if (address.district) addressParts.push(address.district);
      if (address.city) addressParts.push(address.city);
      if (address.pincode) addressParts.push(address.pincode);

      const formattedAddress = addressParts.join(', ');

      return {
        address: formattedAddress || 'Address not found',
        lat,
        lng,
        formatted_address: formattedAddress,
        landmark: address.name || '',
        locality: address.district || '',
        city: address.city || this.DEFAULT_CITY,
        pincode: address.pincode || '',
        state: address.region || this.DEFAULT_STATE,
        country: address.country || this.DEFAULT_COUNTRY,
      };
    } catch (error: any) {
      console.error('Reverse geocode error:', error.message);
      
      // Return basic location data if reverse geocoding fails
      return {
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat,
        lng,
        formatted_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        city: this.DEFAULT_CITY,
        state: this.DEFAULT_STATE,
        country: this.DEFAULT_COUNTRY,
      };
    }
  }

  /**
   * Calculate distance from one location to another
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Find nearby hospitals/medical facilities
   */
  static async findNearbyHospitals(
    centerLat: number,
    centerLng: number,
    radiusKm: number = 10
  ): Promise<LocationData[]> {
    try {
      // This would typically call a hospitals API
      // For now, return mock data
      const mockHospitals = [
        {
          address: 'AIIMS Delhi, Ansari Nagar, New Delhi, Delhi 110029',
          lat: centerLat + (Math.random() - 0.5) * 0.01,
          lng: centerLng + (Math.random() - 0.5) * 0.01,
          landmark: 'AIIMS Main Gate',
          formatted_address: 'AIIMS Delhi, Ansari Nagar, New Delhi, Delhi 110029',
          locality: 'Ansari Nagar',
          city: 'New Delhi',
          pincode: '110029',
        },
        {
          address: 'Safdarjung Hospital, Safdarjung Enclave, New Delhi',
          lat: centerLat + (Math.random() - 0.5) * 0.02,
          lng: centerLng + (Math.random() - 0.5) * 0.02,
          
          formatted_address: 'Safdarjung Hospital, Safdarjung Enclave, New Delhi',
          locality: 'Safdarjung Enclave',
          city: 'New Delhi',
          pincode: '110029',
        },
      ];

      return mockHospitals.map(hospital => ({
        ...hospital,
        distance: this.calculateDistance(centerLat, centerLng, hospital.lat, hospital.lng),
      })).sort((a, b) => a.distance - b.distance);
    } catch (error: any) {
      console.error('Find nearby hospitals error:', error.message);
      return [];
    }
  }

  /**
   * Search for locations by query
   */
  static async searchLocations(query: string): Promise<LocationData[]> {
    try {
      // This would typically call a places/search API like Google Places
      // For now, return mock data
      const mockResults = [
        {
          address: 'City Centre Mall, Connaught Place, New Delhi',
          lat: 28.6315,
          lng: 77.2167,
          landmark: 'Chandni Chowk',
          formatted_address: 'City Centre Mall, Connaught Place, New Delhi, Delhi',
          locality: 'Connaught Place',
          city: 'New Delhi',
          pincode: '110001',
        },
        {
          address: 'Central Park, Gurgaon, Haryana',
          lat: 28.4595,
          lng: 77.0266,
          formatted_address: 'Central Park, Sector 29, Gurgaon, Haryana',
          locality: 'Sector 29',
          city: 'Gurgaon',
          pincode: '122001',
        },
      ];

      return mockResults.filter(result =>
        result.address.toLowerCase().includes(query.toLowerCase()) ||
        result.city.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error: any) {
      console.error('Search locations error:', error.message);
      return [];
    }
  }

  /**
   * Format coordinates for display
   */
  static formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  /**
   * Check if location is valid
   */
  static isValidLocation(lat: number, lng: number): boolean {
    return (
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      !isNaN(lat) &&
      !isNaN(lng)
    );
  }

  /**
   * Check if two locations are close (within given distance)
   */
  static isCloseTo(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    maxDistanceKm: number = 1
  ): boolean {
    const distance = this.calculateDistance(lat1, lng1, lat2, lng2);
    return distance <= maxDistanceKm;
  }

  /**
   * Format distance for display
   */
  static formatDistance(km: number): string {
    if (km < 1) {
      const meters = Math.round(km * 1000);
      return `${meters}m`;
    }
    
    if (km < 10) {
      return `${Math.round(km * 10) / 10}km`;
    }
    
    return `${Math.round(km)}km`;
  }

  /**
   * Get bearing from point A to point B
   */
  static getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return Math.atan2(y, x) * 180 / Math.PI;
  }
}

export default LocationService;
