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
   git clone <repository-url>
   cd pillmate
   
