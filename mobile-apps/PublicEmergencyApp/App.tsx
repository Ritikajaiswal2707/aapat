import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Dimensions,
  StatusBar,
  Vibration,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { Audio } from 'expo-av';
import io from 'socket.io-client';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

interface EmergencyData {
  caller_phone: string;
  patient_info: {
    name?: string;
    age?: number;
    gender?: string;
    blood_type?: string;
    medical_history?: string[];
    allergies?: string[];
  };
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  emergency_type: string;
  symptoms?: string;
  conscious: boolean;
  breathing: boolean;
  bleeding: boolean;
  pain_level?: number;
}

const App: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [ambulanceInfo, setAmbulanceInfo] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  // Emergency types
  const emergencyTypes = [
    { id: 'CARDIAC', name: 'Heart Attack', icon: 'favorite', color: '#dc2626' },
    { id: 'TRAUMA', name: 'Accident/Injury', icon: 'local-hospital', color: '#ea580c' },
    { id: 'RESPIRATORY', name: 'Breathing Problem', icon: 'air', color: '#3b82f6' },
    { id: 'NEUROLOGICAL', name: 'Stroke/Seizure', icon: 'psychology', color: '#8b5cf6' },
    { id: 'PEDIATRIC', name: 'Child Emergency', icon: 'child-care', color: '#10b981' },
    { id: 'GENERAL', name: 'Other Emergency', icon: 'emergency', color: '#6b7280' }
  ];

  useEffect(() => {
    initializeApp();
    return () => {
      if (socket) socket.disconnect();
      if (sound) sound.unloadAsync();
    };
  }, []);

  const initializeApp = async () => {
    await requestPermissions();
    await getCurrentLocation();
    initializeSocket();
    loadEmergencySound();
  };

  const requestPermissions = async () => {
    try {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: contactsStatus } = await Contacts.requestPermissionsAsync();
      
      if (locationStatus !== 'granted') {
        Alert.alert('Permission Required', 'Location access is required for emergency services');
      }
      
      if (contactsStatus !== 'granted') {
        Alert.alert('Permission Required', 'Contact access is required for emergency contacts');
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setLocation(location);
      
      // Get address from coordinates
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (addresses.length > 0) {
        const addr = addresses[0];
        setAddress(`${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.country || ''}`.trim());
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Location Error', 'Unable to get current location. Please enable location services.');
    }
  };

  const initializeSocket = () => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to emergency service');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from emergency service');
    });

    newSocket.on('ambulance_assigned', (data) => {
      setAmbulanceInfo(data);
      playEmergencySound();
      triggerHapticFeedback();
      Speech.speak(`Ambulance ${data.ambulance_id} has been assigned. ETA: ${data.eta_minutes} minutes.`);
    });

    newSocket.on('ambulance_arrived', (data) => {
      Alert.alert('Ambulance Arrived', `Ambulance has arrived at your location. Driver: ${data.driver_name}`);
      stopEmergencySound();
    });

    setSocket(newSocket);
  };

  const loadEmergencySound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/emergency-alert.mp3'),
        { shouldPlay: false, isLooping: true }
      );
      setSound(sound);
    } catch (error) {
      console.error('Sound loading error:', error);
    }
  };

  const playEmergencySound = async () => {
    if (sound) {
      try {
        await sound.playAsync();
      } catch (error) {
        console.error('Sound play error:', error);
      }
    }
  };

  const stopEmergencySound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.error('Sound stop error:', error);
      }
    }
  };

  const triggerHapticFeedback = () => {
    if (hapticEnabled && Platform.OS === 'ios') {
      Vibration.vibrate([0, 500, 200, 500]);
    } else if (hapticEnabled && Platform.OS === 'android') {
      Vibration.vibrate([0, 500, 200, 500]);
    }
  };

  const handleEmergencyPress = (emergencyType: string) => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services and try again.');
      return;
    }

    Alert.alert(
      'Emergency Alert',
      `Are you sure you want to report a ${emergencyType} emergency?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Call Emergency', style: 'destructive', onPress: () => createEmergency(emergencyType) }
      ]
    );
  };

  const createEmergency = async (emergencyType: string) => {
    try {
      setIsEmergencyActive(true);
      triggerHapticFeedback();
      
      const emergencyData: EmergencyData = {
        caller_phone: '+919876543210', // This should be the user's actual phone
        patient_info: {
          name: 'Emergency Patient',
          age: 30,
          gender: 'MALE',
          blood_type: 'O+'
        },
        location: {
          latitude: location!.coords.latitude,
          longitude: location!.coords.longitude
        },
        address: address,
        emergency_type: emergencyType,
        symptoms: 'Emergency situation requiring immediate medical attention',
        conscious: true,
        breathing: true,
        bleeding: false,
        pain_level: 8
      };

      const response = await axios.post('http://localhost:3000/api/emergency/request', emergencyData);
      
      if (response.data.success) {
        setEmergencyId(response.data.data.emergency_id);
        playEmergencySound();
        
        // Send SMS to emergency contacts
        await sendEmergencySMS(emergencyType);
        
        Alert.alert(
          'Emergency Reported',
          `Your ${emergencyType} emergency has been reported. Ambulance is being dispatched.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Emergency creation error:', error);
      Alert.alert('Error', 'Failed to report emergency. Please try again or call 108 directly.');
      setIsEmergencyActive(false);
    }
  };

  const sendEmergencySMS = async (emergencyType: string) => {
    try {
      const emergencyContacts = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers]
      });

      const message = `🚨 EMERGENCY ALERT 🚨\n\nEmergency Type: ${emergencyType}\nLocation: ${address}\nTime: ${new Date().toLocaleString()}\n\nPlease contact emergency services if needed.`;

      if (emergencyContacts.data.length > 0) {
        const phoneNumbers = emergencyContacts.data
          .flatMap(contact => contact.phoneNumbers || [])
          .map(phone => phone.number)
          .slice(0, 3); // Send to first 3 contacts

        for (const phoneNumber of phoneNumbers) {
          await SMS.sendSMSAsync([phoneNumber], message);
        }
      }
    } catch (error) {
      console.error('SMS sending error:', error);
    }
  };

  const cancelEmergency = () => {
    Alert.alert(
      'Cancel Emergency',
      'Are you sure you want to cancel this emergency?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive', 
          onPress: () => {
            setIsEmergencyActive(false);
            setEmergencyId(null);
            setAmbulanceInfo(null);
            stopEmergencySound();
          }
        }
      ]
    );
  };

  const renderEmergencyButton = (type: any) => (
    <TouchableOpacity
      key={type.id}
      style={[styles.emergencyButton, { backgroundColor: type.color }]}
      onPress={() => handleEmergencyPress(type.id)}
      disabled={isEmergencyActive}
    >
      <Icon name={type.icon} size={40} color="white" />
      <Text style={styles.emergencyButtonText}>{type.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚑 Aapat Emergency</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Location Display */}
      <View style={styles.locationContainer}>
        <Icon name="location-on" size={20} color="#6b7280" />
        <Text style={styles.locationText} numberOfLines={2}>
          {address || 'Getting location...'}
        </Text>
      </View>

      {/* Emergency Status */}
      {isEmergencyActive && (
        <View style={styles.emergencyStatusContainer}>
          <Text style={styles.emergencyStatusText}>
            🚨 EMERGENCY ACTIVE - Ambulance Dispatched
          </Text>
          {ambulanceInfo && (
            <Text style={styles.ambulanceInfo}>
              ETA: {ambulanceInfo.eta_minutes} minutes
            </Text>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={cancelEmergency}>
            <Text style={styles.cancelButtonText}>Cancel Emergency</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Emergency Types Grid */}
      <View style={styles.emergencyGrid}>
        {emergencyTypes.map(renderEmergencyButton)}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={getCurrentLocation}>
          <Icon name="my-location" size={24} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Update Location</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Emergency Contacts', 'Feature coming soon')}>
          <Icon name="contacts" size={24} color="#10b981" />
          <Text style={styles.actionButtonText}>Emergency Contacts</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          In case of emergency, call 108 directly
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#dc2626',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  emergencyStatusContainer: {
    backgroundColor: '#fef2f2',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  emergencyStatusText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  ambulanceInfo: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  cancelButton: {
    backgroundColor: '#dc2626',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  emergencyButton: {
    width: width * 0.4,
    height: 120,
    margin: 10,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  actionButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
  },
  actionButtonText: {
    marginTop: 5,
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#1f2937',
    padding: 15,
    alignItems: 'center',
  },
  footerText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default App;
