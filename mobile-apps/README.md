# 🚑 Aapat Mobile Applications

This directory contains the mobile applications for the Aapat Emergency Response Platform.

## 📱 Applications

### 1. Public Emergency App (`PublicEmergencyApp/`)
**Target Users:** General public, patients, families

**Key Features:**
- 🚨 One-tap SOS button with haptic feedback
- 📍 GPS auto-location with manual override
- 🗣️ Voice command SOS (15+ Indian languages)
- 📱 Offline emergency mode (SMS/IVR fallback)
- 👥 Emergency contact quick dial
- 🚑 Real-time ambulance tracking with ETA
- 🏥 Hospital selection and bed availability
- 💊 Medical history integration
- 🔔 Push notifications for status updates

### 2. Driver/Paramedic App (`DriverApp/`)
**Target Users:** Ambulance drivers, paramedics, emergency responders

**Key Features:**
- 🔔 Emergency notification alerts with sound/vibration
- 🗺️ GPS navigation integration
- 👤 Patient information display
- 📊 Status update buttons (En Route, At Patient, Transporting)
- 📞 Emergency contact calling
- 🛣️ Route optimization
- 📋 Patient vitals capture
- 🏥 Hospital communication
- 📱 Offline mode support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Expo CLI (`npm install -g @expo/cli`)
- React Native development environment
- Android Studio / Xcode (for device testing)

### Installation

1. **Install dependencies:**
   ```bash
   cd mobile-apps
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on specific platforms:**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web (for testing)
   npm run web
   ```

### Environment Setup

Create a `.env` file in the `mobile-apps` directory:

```env
# API Configuration
API_BASE_URL=http://localhost:3000
SOCKET_URL=http://localhost:3001

# Emergency Services
EMERGENCY_PHONE=108
SMS_EMERGENCY_NUMBER=108

# Location Services
DEFAULT_LATITUDE=28.6139
DEFAULT_LONGITUDE=77.2090
DEFAULT_CITY=Delhi

# App Configuration
APP_NAME=Aapat Emergency
APP_VERSION=1.0.0
```

## 📋 Features Implementation Status

### ✅ Completed Features

#### Public Emergency App
- [x] One-tap SOS button with visual feedback
- [x] GPS location detection and display
- [x] Emergency type selection (6 categories)
- [x] Real-time ambulance tracking
- [x] Emergency contact SMS integration
- [x] Sound alerts and haptic feedback
- [x] Offline mode detection
- [x] Socket.io real-time updates
- [x] Modern, accessible UI design

#### Driver/Paramedic App
- [x] Driver dashboard with status management
- [x] Emergency assignment notifications
- [x] Real-time location updates
- [x] Status update buttons (5 states)
- [x] Patient information display
- [x] Quick action buttons
- [x] Sound notifications and haptic feedback
- [x] Socket.io real-time communication

### 🚧 In Progress Features

#### Public Emergency App
- [ ] Voice command integration (15+ languages)
- [ ] Wearable device integration
- [ ] Medical history form
- [ ] Insurance verification
- [ ] Multi-language support
- [ ] AR navigation to ambulance

#### Driver/Paramedic App
- [ ] Navigation integration
- [ ] Patient vitals capture
- [ ] Telemedicine integration
- [ ] Equipment checklist
- [ ] Route optimization
- [ ] Offline data sync

### 📅 Planned Features

#### Advanced Features
- [ ] AI-powered triage assistance
- [ ] Augmented Reality (AR) guidance
- [ ] Drone integration for remote areas
- [ ] IoT device integration
- [ ] Blockchain for medical records
- [ ] Machine learning for demand prediction

## 🏗️ Architecture

### Technology Stack
- **Framework:** React Native with Expo
- **Language:** TypeScript
- **State Management:** React Hooks
- **Navigation:** React Navigation
- **Real-time:** Socket.io
- **Maps:** React Native Maps
- **Location:** Expo Location
- **Notifications:** Expo Notifications
- **Audio:** Expo AV
- **UI Components:** React Native Paper

### Project Structure
```
mobile-apps/
├── PublicEmergencyApp/
│   ├── App.tsx                 # Main app component
│   ├── components/             # Reusable components
│   ├── screens/               # Screen components
│   ├── services/              # API and business logic
│   ├── utils/                 # Utility functions
│   └── assets/                # Images, sounds, etc.
├── DriverApp/
│   ├── App.tsx                # Main app component
│   ├── components/            # Reusable components
│   ├── screens/              # Screen components
│   ├── services/             # API and business logic
│   └── utils/                # Utility functions
├── shared/                   # Shared components and utilities
├── package.json
└── README.md
```

## 🔧 Development

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Add comprehensive logging

### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Building for Production

#### Android
```bash
# Build APK
expo build:android

# Build AAB (Google Play)
expo build:android --type app-bundle
```

#### iOS
```bash
# Build for iOS
expo build:ios
```

## 📱 Deployment

### Google Play Store
1. Build AAB file
2. Upload to Google Play Console
3. Configure store listing
4. Submit for review

### Apple App Store
1. Build iOS app
2. Upload to App Store Connect
3. Configure app information
4. Submit for review

### OTA Updates
```bash
# Publish OTA update
expo publish
```

## 🔒 Security

### Data Protection
- All API calls use HTTPS
- Sensitive data encrypted at rest
- Location data anonymized when possible
- Medical data follows HIPAA guidelines

### Authentication
- JWT tokens for API authentication
- Biometric authentication for app access
- Secure storage for credentials
- Session timeout handling

## 📊 Analytics

### Metrics Tracked
- Emergency response times
- App usage patterns
- Feature adoption rates
- Error rates and crashes
- User satisfaction scores

### Tools Used
- Expo Analytics
- Firebase Analytics
- Custom event tracking
- Performance monitoring

## 🆘 Emergency Features

### Critical Functions
- **SOS Button:** One-tap emergency reporting
- **Location Sharing:** Automatic GPS coordinates
- **Contact Notifications:** SMS to emergency contacts
- **Ambulance Tracking:** Real-time location updates
- **Hospital Integration:** Direct bed availability

### Accessibility
- Voice commands for hands-free operation
- High contrast mode for visibility
- Large touch targets for easy tapping
- Screen reader compatibility
- Haptic feedback for confirmation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or emergency issues:
- Email: support@aapat.com
- Phone: +91-XXX-XXXX-XXX
- Emergency: 108

---

**⚠️ Important:** These apps are designed for emergency medical services. Always test thoroughly before deployment and ensure compliance with local medical regulations.
