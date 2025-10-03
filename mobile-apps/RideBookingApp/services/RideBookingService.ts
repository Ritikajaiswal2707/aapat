import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:3010/api/ride';

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  landmark?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  emergency_contact?: string;
}

export interface RideBookingRequest {
  customer: CustomerInfo;
  ride_type: 'emergency' | 'scheduled' | 'medical_transport';
  pickup: {
    address: string;
    location: { lat: number; lng: number };
    landmark?: string;
    instructions?: string;
  };
  destination: {
    address: string;
    location: { lat: number; lng: number };
    landmark?: string;
    hospital_id?: string;
  };
  payment_method: 'cash' | 'upi' | 'card' | 'insurance' | 'corporate';
  scheduled_time?: string;
  medical_info?: {
    mobility_level?: 'independent' | 'assisted' | 'wheelchair' | 'stretcher';
    patient_condition?: string;
    medical_equipment_required?: string[];
    emergency_type?: string;
    priority_level?: 1 | 2 | 3 | 4;
  };
}

export interface AmbulanceOption {
  ambulance_id: string;
  eta_minutes: number;
  distance_km: number;
  driver_name: string;
  driver_phone: string;
  rating: number;
  estimated_fare: number;
}

export interface FareEstimate {
  base_fare: number;
  distance_fare: number;
  equipment_surcharge: number;
  priority_multiplier: number;
  total_fare: number;
  breakdown: {
    base_fare: number;
    distance_fare: number;
    equipment_surcharge: number;
    priority_multiplier: number;
  };
}

export interface BookingResponse {
  success: boolean;
  message: string;
  booking_id: string;
  estimated_options?: AmbulanceOption[];
  fare_estimate?: FareEstimate;
  selected_ambulance?: AmbulanceOption;
  data?: any;
}

export interface AssignmentResponse {
  success: boolean;
  message: string;
  booking_id: string;
  selected_ambulance: AmbulanceOption;
  eta_minutes: number;
  status: string;
}

export interface BookingStatusResponse {
  success: boolean;
  booking: {
    id: string;
    status: string;
    ride_type: string;
    pickup: any;
    destination: any;
    selected_ambulance?: AmbulanceOption;
    eta_minutes?: number;
    fare_estimate?: FareEstimate;
    created_at: string;
    updated_at: string;
    ambulance_current_status?: any;
  };
}

export interface PreviewResponse {
  success: boolean;
  data: {
    available_ambulances: AmbulanceOption[];
    estimated_fare: FareEstimate;
    ride_type: string;
    location: { lat: number; lng: number };
  };
}

class RideBookingService {
  /**
   * Get booking preview with available ambulances and fare estimate
   */
  static async getPreview(
    lat: number,
    lng: number,
    rideType: string = 'emergency'
  ): Promise<PreviewResponse> {
    try {
      const response: AxiosResponse<PreviewResponse> = await axios.get(
        `${API_BASE_URL}/preview`,
        {
          params: {
            lat,
            lng,
            ride_type: rideType,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Preview request failed:', error.message);
      throw new Error(`Failed to get booking preview: ${error.message}`);
    }
  }

  /**
   * Create a new ride booking
   */
  static async createBooking(bookingData: RideBookingRequest): Promise<BookingResponse> {
    try {
      const response: AxiosResponse<BookingResponse> = await axios.post(
        `${API_BASE_URL}/book`,
        bookingData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Booking creation failed:', error.message);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(`Failed to create booking: ${error.message}`);
    }
  }

  /**
   * Assign specific ambulance to booking
   */
  static async assignAmbulance(
    bookingId: string,
    ambulanceId: string
  ): Promise<AssignmentResponse> {
    try {
      const response: AxiosResponse<AssignmentResponse> = await axios.post(
        `${API_BASE_URL}/assign`,
        {
          booking_id: bookingId,
          ambulance_id: ambulanceId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Ambulance assignment failed:', error.message);
     Bearer 3b7fb2f65ccce44e74ad4f0b1b3f3b3b7fb2f65ccce40
        throw new Error(`Failed to assign ambulance: ${error.message}`);
      }
      throw new Error(`Failed to assign ambulance: ${error.message}`);
    }
  }

  /**
   * Get current booking status
   */
  static async getBookingStatus(bookingId: string): Promise<BookingStatusResponse> {
    try {
      const response: AxiosResponse<BookingStatusResponse> = await axios.get(
        `${API_BASE_URL}/status/${bookingId}`,
        {
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Get booking status failed:', error.message);
      if (error.response?.status === 404) {
        throw new Error('Booking not found or expired');
      }
      throw new Error(`Failed to get booking status: ${error.message}`);
    }
  }

  /**
   * Cancel existing booking
   */
  static async cancelBooking(bookingId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; message: string }> = await axios.delete(
        `${API_BASE_URL}/${bookingId}`,
        {
          timeout: 5000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Booking cancellation failed:', error.message);
      if (error.response?.status === 404) {
        throw new Error('Booking not found');
      }
      throw new Error(`Failed to cancel booking: ${error.message}`);
    }
  }

  /**
   * Estimate fare for given route and ride type
   */
  static async estimateFare(
    pickupLocation: LocationData,
    destinationLocation: LocationData,
    rideType: string
  ): Promise<FareEstimate> {
    try {
      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        destinationLocation.lat,
        destinationLocation.lng
      );

      // Get preview with distance estimation
      const preview = await this.getPreview(pickupLocation.lat, pickupLocation.lng, rideType);
      
      return preview.data.estimated_fare;
    } catch (error: any) {
      console.error('Fare estimation failed:', error.message);
      throw new Error(`Failed to estimate fare: ${error.message}`);
    }
  }

  /**
   * Check if ambulance is available in area
   */
  static async checkAvailability(
    lat: number,
    lng: number,
    rideType: string = 'emergency'
  ): Promise<{ available: boolean; count: number; eta_minutes: number }> {
    try {
      const response = await this.getPreview(lat, lng, rideType);
      
      if (response.success && response.data.available_ambulances.length > 0) {
        const ambulance = response.data.available_ambulances[0];
        return {
          available: true,
          count: response.data.available_ambulances.length,
          eta_minutes: ambulance.eta_minutes,
        };
      }
      
      return {
        available: false,
        count: 0,
        eta_minutes: 0,
      };
    } catch (error: any) {
      console.error('Availability check failed:', error.message);
      return {
        available: false,
        count: 0,
        eta_minutes: 0,
      };
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
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
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  /**
   * Format time duration
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} mins`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Format distance for display
   */
  static formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    
    if (km < 10) {
      return `${Math.round(km * 10) / 10} km`;
    }
    
    return `${Math.round(km)} km`;
  }

  /**
   * Get ride type display info
   */
  static getRideTypeInfo(rideType: string): {
    icon: string;
    title: string;
    description: string;
    color: string;
  } {
    switch (rideType) {
      case 'emergency':
        return {
          icon: '🚨',
          title: 'Emergency Ride',
          description: 'Critical medical emergencies',
          color: '#dc3545',
        };
      case 'scheduled':
        return {
          icon: '📅',
          title: 'Scheduled Ride',
          description: 'Book in advance for appointments',
          color: '#007bff',
        };
      case 'medical_transport':
        return {
          icon: '🚑',
          title: 'Medical Transport',
          description: 'Regular medical transportation',
          color: '#28a745',
        };
      default:
        return {
          icon: '🚑',
          title: 'Medical Ride',
          description: 'Medical transportation service',
          color: '#6c757d',
        };
    }
  }

  /**
   * Get status display info
   */
  static getStatusInfo(status: string): {
    icon: string;
    title: string;
    description: string;
    color: string;
  } {
    switch (status) {
      case 'searching_ambulance':
        return {
          icon: '🔍',
          title: 'Searching Ambulance',
          description: 'Finding available ambulances',
          color: '#fd7e14',
        };
      case 'confirmed':
        return {
          icon: '✅',
          title: 'Ride Confirmed',
          description: 'Ambulance assigned and confirmed',
          color: '#28a745',
        };
      case 'assigned':
        return {
          icon: '🚑',
          title: 'Ambulance Assigned',
          description: 'Driver en route to pickup location',
          color: '#007bff',
        };
      case 'en_route':
        return {
          icon: '📍',
          title: 'En Route',
          description: 'Ambulance heading to you',
          color: '#6f42c1',
        };
      case 'at_patient':
        return {
          icon: '👤',
          title: 'At Patient',
          description: 'Driver has arrived',
          color: '#20c997',
        };
      case 'transporting':
        return {
          icon: '🚑',
          title: 'Transporting',
          description: 'En route to destination',
          color: '#fd7e14',
        };
      case 'completed':
        return {
          icon: '✓',
          title: 'Completed',
          description: 'Ride completed successfully',
          color: '#28a745',
        };
      case 'cancelled':
        return {
          icon: '❌',
          title: 'Cancelled',
          description: 'Ride was cancelled',
          color: '#dc3545',
        };
      default:
        return {
          icon: '❓',
          title: 'Unknown Status',
          description: 'Status not recognized',
          color: '#6c757d',
        };
    }
  }
}

export default RideBookingService;
