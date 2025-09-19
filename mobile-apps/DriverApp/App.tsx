import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Dimensions,
  StatusBar,
  ScrollView,
  Vibration,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import io from 'socket.io-client';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

interface EmergencyAssignment {
  id: string;
  emergency_type: string;
  priority_level: number;
  patient_info: any;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  symptoms: string;
  estimated_arrival: string;
  eta_minutes: number;
}

interface AmbulanceStatus {
  id: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'ON_ROUTE' | 'AT_PATIENT' | 'TRANSPORTING' | 'AT_HOSPITAL';
  fuel_level: number;
  location: {
    latitude: number;
    longitude: number;
  };
}

const App: React.FC = () => {
  const [ambulanceStatus, setAmbulanceStatus] = useState<AmbulanceStatus | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<EmergencyAssignment | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [driverInfo, setDriverInfo] = useState({
    name: 'John Doe',
    id: 'driver-123',
    rating: 4.8,
    phone: '+919876543210'
  });

  const statusColors = {
    'AVAILABLE': '#10b981',
    'ASSIGNED': '#f59e0b',
    'ON_ROUTE': '#3b82f6',
    'AT_PATIENT': '#8b5cf6',
    'TRANSPORTING': '#dc2626',
    'AT_HOSPITAL': '#6b7280'
  };

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
    loadNotificationSound();
    fetchAmbulanceStatus();
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is required for ambulance tracking');
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
      updateAmbulanceLocation(location);
    } catch (error) {
      console.error('Location error:', error);
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

    newSocket.on('new_emergency', (emergency) => {
      if (isOnDuty && ambulanceStatus?.status === 'AVAILABLE') {
        showEmergencyAlert(emergency);
      }
    });

    newSocket.on('emergency_assigned', (assignment) => {
      setCurrentAssignment(assignment);
      playNotificationSound();
      triggerHapticFeedback();
      Speech.speak(`New emergency assignment. ${assignment.emergency_type} at ${assignment.address}`);
    });

    setSocket(newSocket);
  };

  const loadNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/notification.mp3'),
        { shouldPlay: false }
      );
      setSound(sound);
    } catch (error) {
      console.error('Sound loading error:', error);
    }
  };

  const playNotificationSound = async () => {
    if (sound) {
      try {
        await sound.playAsync();
      } catch (error) {
        console.error('Sound play error:', error);
      }
    }
  };

  const triggerHapticFeedback = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, 500, 200, 500]);
    } else if (Platform.OS === 'android') {
      Vibration.vibrate([0, 500, 200, 500]);
    }
  };

  const fetchAmbulanceStatus = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/ambulances/driver-123');
      if (response.data.success) {
        setAmbulanceStatus(response.data.data);
      }
    } catch (error) {
      console.error('Fetch ambulance status error:', error);
    }
  };

  const updateAmbulanceLocation = async (location: Location.LocationObject) => {
    if (!ambulanceStatus) return;

    try {
      await axios.put(`http://localhost:3000/api/ambulances/${ambulanceStatus.id}/location`, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        heading: location.coords.heading,
        speed: location.coords.speed
      });
    } catch (error) {
      console.error('Update location error:', error);
    }
  };

  const showEmergencyAlert = (emergency: any) => {
    Alert.alert(
      '🚨 New Emergency Assignment',
      `Type: ${emergency.emergency_type}\nPriority: ${emergency.priority}\nLocation: ${emergency.address}`,
      [
        { text: 'Decline', style: 'cancel' },
        { text: 'Accept', onPress: () => acceptEmergency(emergency) }
      ]
    );
  };

  const acceptEmergency = async (emergency: any) => {
    try {
      const response = await axios.post('http://localhost:3000/api/dispatch/assign', {
        emergency_id: emergency.id,
        preferred_ambulance_id: ambulanceStatus?.id
      });

      if (response.data.success) {
        setCurrentAssignment(response.data.data);
        updateAmbulanceStatus('ASSIGNED');
        playNotificationSound();
      }
    } catch (error) {
      console.error('Accept emergency error:', error);
      Alert.alert('Error', 'Failed to accept emergency assignment');
    }
  };

  const updateAmbulanceStatus = async (status: string) => {
    if (!ambulanceStatus) return;

    try {
      await axios.put(`http://localhost:3000/api/ambulances/${ambulanceStatus.id}/status`, {
        status: status,
        notes: `Status updated by driver ${driverInfo.name}`
      });

      setAmbulanceStatus(prev => prev ? { ...prev, status: status as any } : null);
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const toggleDutyStatus = () => {
    if (isOnDuty) {
      Alert.alert(
        'Go Off Duty',
        'Are you sure you want to go off duty?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Off Duty', onPress: () => setIsOnDuty(false) }
        ]
      );
    } else {
      setIsOnDuty(true);
      updateAmbulanceStatus('AVAILABLE');
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (!currentAssignment) {
      Alert.alert('No Assignment', 'You don\'t have an active emergency assignment');
      return;
    }

    updateAmbulanceStatus(newStatus);
    
    // Update dispatch status
    if (currentAssignment) {
      axios.put(`http://localhost:3000/api/dispatch/status/${currentAssignment.id}`, {
        status: newStatus,
        notes: `Status updated by driver ${driverInfo.name}`
      });
    }
  };

  const completeAssignment = () => {
    Alert.alert(
      'Complete Assignment',
      'Mark this emergency assignment as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: () => {
            updateAmbulanceStatus('AVAILABLE');
            setCurrentAssignment(null);
            Alert.alert('Assignment Completed', 'You are now available for new assignments');
          }
        }
      ]
    );
  };

  const callPatient = () => {
    if (currentAssignment?.patient_info?.phone) {
      Alert.alert('Call Patient', `Call ${currentAssignment.patient_info.phone}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => {
          // Implement phone calling functionality
          Alert.alert('Calling...', 'Phone call functionality would be implemented here');
        }}
      ]);
    } else {
      Alert.alert('No Contact', 'Patient contact information not available');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🚑 Driver Dashboard</Text>
          <Text style={styles.driverName}>{driverInfo.name}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Duty Status */}
        <View style={styles.dutyContainer}>
          <TouchableOpacity
            style={[styles.dutyButton, { backgroundColor: isOnDuty ? '#ef4444' : '#10b981' }]}
            onPress={toggleDutyStatus}
          >
            <Icon name={isOnDuty ? 'pause' : 'play-arrow'} size={24} color="white" />
            <Text style={styles.dutyButtonText}>
              {isOnDuty ? 'Go Off Duty' : 'Go On Duty'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ambulance Status */}
        {ambulanceStatus && (
          <View style={styles.statusCard}>
            <Text style={styles.cardTitle}>Ambulance Status</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[ambulanceStatus.status] }]}>
                <Text style={styles.statusBadgeText}>{ambulanceStatus.status}</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Fuel Level:</Text>
              <Text style={styles.statusValue}>{ambulanceStatus.fuel_level}%</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Location:</Text>
              <Text style={styles.statusValue}>
                {location ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : 'Unknown'}
              </Text>
            </View>
          </View>
        )}

        {/* Current Assignment */}
        {currentAssignment && (
          <View style={styles.assignmentCard}>
            <Text style={styles.cardTitle}>Current Assignment</Text>
            <View style={styles.assignmentInfo}>
              <Text style={styles.emergencyType}>{currentAssignment.emergency_type}</Text>
              <Text style={styles.priority}>Priority: {currentAssignment.priority_level}</Text>
              <Text style={styles.address}>{currentAssignment.address}</Text>
              <Text style={styles.symptoms}>{currentAssignment.symptoms}</Text>
              <Text style={styles.eta}>ETA: {currentAssignment.eta_minutes} minutes</Text>
            </View>
            
            <View style={styles.assignmentActions}>
              <TouchableOpacity style={styles.actionButton} onPress={callPatient}>
                <Icon name="phone" size={20} color="white" />
                <Text style={styles.actionButtonText}>Call Patient</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={completeAssignment}>
                <Icon name="check" size={20} color="white" />
                <Text style={styles.actionButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Status Update Buttons */}
        {isOnDuty && (
          <View style={styles.statusUpdateContainer}>
            <Text style={styles.cardTitle}>Update Status</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: '#3b82f6' }]}
                onPress={() => handleStatusUpdate('ON_ROUTE')}
              >
                <Icon name="directions" size={24} color="white" />
                <Text style={styles.statusButtonText}>En Route</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: '#8b5cf6' }]}
                onPress={() => handleStatusUpdate('AT_PATIENT')}
              >
                <Icon name="person" size={24} color="white" />
                <Text style={styles.statusButtonText}>At Patient</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: '#dc2626' }]}
                onPress={() => handleStatusUpdate('TRANSPORTING')}
              >
                <Icon name="local-hospital" size={24} color="white" />
                <Text style={styles.statusButtonText}>Transporting</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.statusButton, { backgroundColor: '#6b7280' }]}
                onPress={() => handleStatusUpdate('AT_HOSPITAL')}
              >
                <Icon name="home" size={24} color="white" />
                <Text style={styles.statusButtonText}>At Hospital</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={getCurrentLocation}>
            <Icon name="my-location" size={24} color="#3b82f6" />
            <Text style={styles.quickActionText}>Update Location</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Navigation', 'Navigation feature coming soon')}>
            <Icon name="navigation" size={24} color="#10b981" />
            <Text style={styles.quickActionText}>Navigation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Emergency', 'Emergency contact feature coming soon')}>
            <Icon name="emergency" size={24} color="#ef4444" />
            <Text style={styles.quickActionText}>Emergency</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1f2937',
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
  driverName: {
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 4,
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
  content: {
    flex: 1,
    padding: 15,
  },
  dutyContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dutyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  dutyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  assignmentCard: {
    backgroundColor: '#fef2f2',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  assignmentInfo: {
    marginBottom: 15,
  },
  emergencyType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 5,
  },
  priority: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 5,
  },
  address: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 5,
  },
  symptoms: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  eta: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  assignmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  statusUpdateContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  quickActionText: {
    marginTop: 5,
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
});

export default App;
