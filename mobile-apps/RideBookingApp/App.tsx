import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import LocationService from './services/LocationService';
import RideBookingService from './services/RideBookingService';

const { width, height } = Dimensions.get('window');

interface LocationData {
  address: string;
  lat: number;
  lng: number;
  landmark?: string;
}

interface RideBookingData {
  id: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  ride_type: 'emergency' | 'scheduled' | 'medical_transport';
  pickup: LocationData;
  destination: LocationData;
  estimated_fare?: number;
  eta_minutes?: number;
  status: string;
}

interface AmbulanceOption {
  ambulance_id: string;
  eta_minutes: number;
  distance_km: number;
  driver_name: string;
  driver_rating: number;
  estimated_fare: number;
}

interface FareEstimate {
  base_fare: number;
  distance_fare: number;
  total_fare: number;
  breakdown: any;
}

const RideBookingApp: React.FC = () => {
  // State management
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [rideType, setRideType] = useState<'emergency' | 'scheduled' | 'medical_transport'>('emergency');
  const [bookingData, setBookingData] = useState<RideBookingData | null>(null);
  const [availableOptions, setAvailableOptions] = useState<AmbulanceOption[]>([]);
  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    emergency_contact: ''
  });

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3010');
    setSocket(newSocket);

    newSocket.on('ride_booking_created', (data: RideBookingData) => {
      console.log('Booking created:', data);
      setBookingData(data);
      if (data.available_options) {
        setAvailableOptions(data.available_options);
      }
    });

    newSocket.on('ride_booking_confirmed', (data: RideBookingData) => {
      console.log('Booking confirmed:', data);
      setBookingData(data);
      Alert.alert('🚑 Ride Confirmed!', `Ambulance ${data.selected_ambulance?.driver_name} is ${data.selected_ambulance?.eta_minutes} minutes away.`);
    });

    newSocket.on('ride_booking_cancelled', (data: any) => {
      console.log('Booking cancelled:', data);
      setBookingData(null);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Get current location on app start
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get your location. Please enable location services.');
    }
  };

  const getBookingPreview = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Please enable location services');
      return;
    }

    setLoading(true);
    try {
      const response = await RideBookingService.getPreview(
        currentLocation.lat,
        currentLocation.lng,
        rideType
      );

      if (response.success) {
        setAvailableOptions(response.data.available_ambulances);
        setFareEstimate(response.data.estimated_fare);
      }
    } catch (error) {
      console.error('Preview error:', error);
      Alert.alert('Error', 'Failed to get booking preview');
    } finally {
      setLoading(false);
    }
  };

  const createRideBooking = async () => {
    if (!currentLocation || !destination || !customerInfo.name || !customerInfo.phone) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        customer: customerInfo,
        ride_type: rideType,
        pickup: {
          address: currentLocation.address,
          location: {
            lat: currentLocation.lat,
            lng: currentLocation.lng
          },
          landmark: currentLocation.landmark,
          instructions: rideType === 'emergency' ? 'EMERGENCY - Priority dispatch required' : ''
        },
        destination: {
          address: destination.address,
          location: {
            lat: destination.lat,
            lng: destination.lng
          },
          landmark: destination.landmark
        },
        payment_method: 'upi',
        scheduled_time: rideType === 'scheduled' ? selectedDate.toISOString() : undefined,
        medical_info: {
          mobility_level: 'independent',
          patient_condition: rideType === 'emergency' ? 'emergency_situation' : 'regular_transport'
        }
      };

      const response = await RideBookingService.createBooking(requestData);

      if (response.success) {
        setBookingData(response);
        Alert.alert('🚑 Booking Created!', `${response.message}\nBooking ID: ${response.booking_id}`);
      } else {
        Alert.alert('Booking Failed', response.message);
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Booking Error', 'Failed to create ride booking');
    } finally {
      setLoading(false);
    }
  };

  const confirmAmbulanceSelection = async (ambulanceId: string) => {
    if (!bookingData) return;

    setLoading(true);
    try {
      const response = await RideBookingService.assignAmbulance(
        bookingData.id,
        ambulanceId
      );

      if (response.success) {

        Alert.alert('Аmbulance Confirmed!', `Driver is ${response.eta_minutes} minutes away`);
      } else {
        Alert.alert('Assignment Failed', response.message);
      }
    } catch (error) {
      console.error('Assignment error:', error);
      Alert.alert('Assignment Error', 'Failed to confirm ambulance');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async () => {
    if (!bookingData) return;

    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await RideBookingService.cancelBooking(bookingData.id);
              setBookingData(null);
              setAvailableOptions([]);
              Alert.alert('Ride Cancelled', 'Your ride has been cancelled');
            } catch (error) {
              Alert.alert('Cancellation Error', 'Failed to cancel ride');
            }
          }
        }
      ]
    );
  };

  const renderLocationSelector = (type: 'pickup' | 'destination') => {
    const location = type === 'pickup' ? currentLocation : destination;
    const placeholder = type === 'pickup' ? '📍 Current Location' : '🏥 Hospital/Destination';
    
    return (
      <TouchableOpacity
        style={styles.locationSelector}
        onPress={() => {/* Navigate to location selection */}}
      >
        <Text style={styles.locationSelectorText}>
          {location ? location.address : placeholder}
        </Text>
        <Text style={styles.editButton}>Edit</Text>
      </TouchableOpacity>
    );
  };

  const renderRideOptions = () => {
    return (
      <View style={styles.rideOptionsContainer}>
        <TouchableOpacity
          style={[
            styles.rideOptionButton,
            rideType === 'emergency' && styles.selectedRideOption
          ]}
          onPress={() => setRideType('emergency')}
        >
          <Text style={styles.rideOptionIcon}>🚨</Text>
          <Text style={styles.rideOptionText}>Emergency</Text>
          <Text style={styles.rideOptionSubtext}>0-15 min</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.rideOptionButton,
            rideType === 'scheduled' && styles.selectedRideOption
          ]}
          onPress={() => setRideType('scheduled')}
        >
          <Text style={styles.rideOptionIcon}>📅</Text>
          <Text style={styles.rideOptionText}>Scheduled</Text>
          <Text style={styles.rideOptionSubtext}>Book ahead</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.rideOptionButton,
            rideType === 'medical_transport' && styles.selectedRideOption
          ]}
          onPress={() => setRideType('medical_transport')}
        >
          <Text style={styles.rideOptionIcon}>🚑</Text>
          <Text style={styles.rideOptionText}>Medical</Text>
          <Text style={styles.rideOptionSubtext}>Regular transport</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAvailableOptions = () => {
    if (availableOptions.length === 0) return null;

    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsTitle}>Available Ambulances</Text>
        {availableOptions.map((option, index) => (
          <TouchableOpacity
            key={option.ambulance_id}
            style={styles.optionItem}
            onPress={() => confirmAmbulanceSelection(option.ambulance_id)}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionLeft}>
                <Text style={styles.optionDriverName}>{option.driver_name}</Text>
                <Text style={styles.optionEta}>ETA: {option.eta_minutes} mins</Text>
                <Text style={styles.optionRating}>⭐ {option.driver_rating}/5</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionFare}>₹{option.estimated_fare}</Text>
                <Text style={styles.optionDistance}>{option.distance_km} km away</Text>
              </View>
            </View>
            {index < availableOptions.length - 1 && <View style={styles.optionSeparator} />}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#C41E3A" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚑 Aapat Ride Booking</Text>
        <TouchableOpacity style={styles.headerButton} onPress={getCurrentLocation}>
          <Text style={styles.headerButtonText}>📍 Current</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Customer Information</Text>
          <View style={styles.inputGroup}>
            <TouchableOpacity style={styles.inputField}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <Text style={styles.inputValue}>
                {customerInfo.name || 'Enter your name'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.inputField}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <Text style={styles.inputValue}>
                {customerInfo.phone || 'Enter phone number'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ride Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚑 Ride Type</Text>
          {renderRideOptions()}
        </View>

        {/* Location Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Locations</Text>
          {renderLocationSelector('pickup')}
          <View style={styles.locationConnector}>
            <View style={styles.locationLine} />
            <View style={styles.locationDot} />
            <View style={styles.locationDot} />
            <View style={styles.locationDot} />
          </View>
          {renderLocationSelector('destination')}
        </View>

        {/* Fare Estimate */}
        {fareEstimate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💵 Fare Estimate</Text>
            <View style={styles.fareContainer}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Base Fare</Text>
                <Text style={styles.fareValue}>₹{fareEstimate.base_fare}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Distance Fare</Text>
                <Text style={styles.fareValue}>₹{fareEstimate.distance_fare}</Text>
              </View>
              <View style={styles.fareTotalRow}>
                <Text style={styles.fareTotalLabel}>Total Estimated</Text>
                <Text style={styles.fareTotalValue}>₹{fareEstimate.total_fare}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Available Options */}
        {renderAvailableOptions()}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!bookingData ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.bookButton]}
              onPress={createRideBooking}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>🚑 Book Ambulance Ride</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.bookingActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={cancelBooking}
              >
                <Text style={styles.actionButtonText}>❌ Cancel Ride</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.statusButton]}
                onPress={() => {/* Navigate to tracking */}}
              >
                <Text style={styles.actionButtonText}>📍 Track Ride</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Preview Button */}
        <TouchableOpacity
          style={styles.previewButton}
          onPress={getBookingPreview}
          disabled={loading}
        >
          <Text style={styles.previewButtonText}>
            🔍 Get Available Options
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#C41E3A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
 headerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerButtonText: {
    color: '#C41E3A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  inputGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  inputField: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  inputValue: {
    fontSize: 16,
    color: '#333',
  },
  rideOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rideOptionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  selectedRideOption: {
    backgroundColor: '#C41E3A',
  },
  rideOptionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  rideOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  rideOptionSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  locationSelector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationSelectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  editButton: {
    color: '#C41E3A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationConnector: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C41E3A',
    marginVertical: 2,
  },
  fareContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fareLabel: {
    fontSize: 16,
    color: '#666',
  },
  fareValue: {
    fontSize: 16,
    color: '#333',
  },
  fareTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  fareTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  fareTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C41E3A',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  optionItem: {
    paddingVertical: 15,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLeft: {
    flex: 1,
  },
  optionDriverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  optionEta: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  optionRating: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  optionRight: {
    alignItems: 'flex-end',
  },
  optionFare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C41E3A',
  },
  optionDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  optionSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  actionContainer: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#C41E3A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#C41E3A',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    flex: 1,
    marginRight: 10,
  },
  statusButton: {
    backgroundColor: '#28a745',
    flex: 1,
  },
  bookingActions: {
    flexDirection: 'row',
  },
  previewButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C41E3A',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  previewButtonText: {
    color: '#C41E3A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RideBookingApp;
