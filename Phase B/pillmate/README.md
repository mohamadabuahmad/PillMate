# 💊 PillMate

A comprehensive medication management application built with React Native and Expo, featuring AI-powered assistance, hardware device integration, and advanced safety features.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB.svg)
![Expo](https://img.shields.io/badge/Expo-~54.0.29-000020.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-~5.9.2-3178C6.svg)
![Tests](https://img.shields.io/badge/tests-97.7%25%20passing-brightgreen.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Hardware Integration](#-hardware-integration)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Functionality
- **Medication Scheduling**: Schedule medications with custom times and dosages
- **Smart Notifications**: Push notifications for medication reminders
- **Device Integration**: Connect and control M5Stack hardware for automated pill dispensing
- **AI Assistant**: Chat with an AI-powered medication assistant for questions about medications, interactions, and dosages
- **Safety Features**: 
  - Allergy checking before medication scheduling
  - Drug interaction warnings
  - Medication safety validation

### User Experience
- **Multi-language Support**: English and Arabic language support
- **Theme Support**: Light, dark, and auto theme modes
- **Accessibility**: 
  - High contrast mode
  - Simplified UI mode
  - Scalable fonts and spacing
  - Minimum touch target sizes
- **User Authentication**: Secure sign-up and sign-in with Firebase
- **Profile Management**: Edit profile, change password, manage allergies

### Additional Features
- **Device Management**: Link and manage multiple M5Stack devices
- **Slot Management**: Monitor and manage medication slots on connected devices
- **Tutorial System**: Interactive tutorial for new users
- **Responsive Design**: Works on iOS, Android, and Web

## 🛠 Tech Stack

### Frontend
- **React Native** (0.81.5) - Cross-platform mobile framework
- **Expo** (~54.0.29) - Development platform and toolchain
- **Expo Router** (~6.0.19) - File-based routing
- **TypeScript** (~5.9.2) - Type-safe JavaScript
- **React** (19.1.0) - UI library

### Backend & Services
- **Firebase** (^12.7.0) - Backend services:
  - Authentication
  - Firestore (database)
  - Realtime Database (device communication)
  - Cloud Functions (AI chat, allergy checking)
- **OpenAI API** - AI-powered medication assistant

### Key Libraries
- `@react-native-async-storage/async-storage` - Local data persistence
- `expo-notifications` - Push notifications
- `react-native-reanimated` - Animations
- `react-native-safe-area-context` - Safe area handling

### Testing
- **Jest** (^29.7.0) - Testing framework
- **@testing-library/react-native** - Component testing
- **jest-expo** (~52.0.0) - Expo testing utilities

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (for iOS development on macOS) or **Android Studio** (for Android development)
- **Firebase Account** - For backend services
- **OpenAI API Key** - For AI chat functionality (optional, but recommended)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pillmate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Firebase Functions dependencies** (if using Cloud Functions)
   ```bash
   cd functions
   npm install
   cd ..
   ```

4. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Copy your Firebase configuration
   - Update `src/firebase.ts` and `src/firebase.web.ts` with your Firebase config

5. **Configure Environment Variables**
   - Set up your Firebase project configuration
   - Add OpenAI API key to Firebase Functions environment (if using AI chat)

## ⚙️ Configuration

### Firebase Setup

1. Create a Firebase project and enable:
   - Authentication (Email/Password)
   - Firestore Database
   - Realtime Database
   - Cloud Functions

2. Update Firebase configuration in:
   - `src/firebase.ts` (mobile)
   - `src/firebase.web.ts` (web)

3. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

4. Deploy Cloud Functions:
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

### App Configuration

Update `app.json` with your app details:
- Bundle identifier (iOS)
- Package name (Android)
- App name and slug

## 💻 Usage

### Development

Start the development server:
```bash
npm start
```

Run on specific platforms:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### Building for Production

```bash
# iOS
expo build:ios

# Android
expo build:android
```

## 🧪 Testing

The project includes comprehensive test coverage with a **97.7% pass rate** (86/88 tests passing).

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test sign-in
```

### Test Coverage

- ✅ User authentication (login, signup)
- ✅ Device pairing and management
- ✅ Medication scheduling
- ✅ Allergy management
- ✅ Profile management
- ✅ Settings and preferences
- ✅ Error handling
- ✅ Form validation

See [FINAL_TEST_SUMMARY.md](./FINAL_TEST_SUMMARY.md) for detailed test information.

## 📁 Project Structure

```
pillmate/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── allergy-form.tsx
│   ├── (device)/          # Device management screens
│   │   ├── link.tsx
│   │   └── slots.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Home screen
│   │   ├── chat.tsx       # AI chat
│   │   ├── profile.tsx
│   │   └── settings.tsx
│   └── __tests__/         # Test files
├── components/             # Reusable components
│   ├── DoseCard.tsx
│   ├── Tutorial.tsx
│   └── ...
├── contexts/               # React contexts
│   ├── ThemeContext.tsx
│   ├── LanguageContext.tsx
│   └── AccessibilityContext.tsx
├── constants/              # Constants and types
│   ├── Colors.ts
│   ├── DesignSystem.ts
│   └── types.ts
├── hooks/                  # Custom React hooks
│   ├── notifications.ts
│   ├── useMedicationSafety.ts
│   └── ...
├── src/                    # Source files
│   ├── firebase.ts        # Firebase config (mobile)
│   └── firebase.web.ts    # Firebase config (web)
├── functions/              # Firebase Cloud Functions
│   └── src/
│       └── index.ts
├── assets/                 # Images, fonts, etc.
├── m5stack_pillmate.ino   # Arduino code for M5Stack device
└── package.json
```

## 🔌 Hardware Integration

PillMate integrates with M5Stack hardware devices for automated pill dispensing. The Arduino code (`m5stack_pillmate.ino`) controls the device motors and communicates with the app via Firebase Realtime Database.

### Device Setup

1. Flash the Arduino code to your M5Stack device
2. Connect the device to WiFi
3. Link the device in the app using the pairing code
4. Configure medication slots on the device

See [MOTOR_ROTATION_SETUP.md](./MOTOR_ROTATION_SETUP.md) for hardware setup instructions.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Ensure all tests pass before submitting
- Follow the existing code style
- Update documentation as needed

## 📄 License

This project is private and proprietary.

## ⚠️ Important Medical Disclaimer

**This application is for demonstration purposes only.** Always consult with your doctor or healthcare provider before making any decisions about your medications, dosages, or treatment plans. The app is not responsible for any medical decisions or outcomes. The information provided in this app should not replace professional medical advice, diagnosis, or treatment.

## 🙏 Acknowledgments

- Expo team for the amazing development platform
- Firebase for backend services
- OpenAI for AI capabilities
- React Native community

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Made with ❤️ for better medication management**
