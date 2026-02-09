# PillMate App Architecture - How Everything Connects

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EXPO ROUTER (Navigation)                  │
│  File-based routing: app/ directory structure               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ROOT LAYOUT (_layout.tsx)                      │
│  Wraps entire app with Context Providers:                   │
│  • ThemeProvider → LanguageProvider → AccessibilityProvider │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Auth Flow   │  │  Device Flow │  │  Main Tabs   │
│  (auth)/     │  │  (device)/   │  │  (tabs)/     │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🔄 Complete Data Flow

### 1. **App Initialization Flow**

```
App Start
   │
   ├─→ _layout.tsx (Root Layout)
   │     │
   │     ├─→ ThemeProvider
   │     │     └─→ Loads theme from AsyncStorage
   │     │     └─→ Provides: theme, setTheme, isDark
   │     │
   │     ├─→ LanguageProvider
   │     │     └─→ Loads language from AsyncStorage
   │     │     └─→ Provides: language, setLanguage, t() (translations)
   │     │
   │     └─→ AccessibilityProvider
   │           └─→ Provides: font scaling, contrast, simplified mode
   │
   └─→ Firebase Initialization (src/firebase.ts)
         ├─→ Auth (with AsyncStorage persistence)
         ├─→ Firestore (user data, medications, schedules)
         ├─→ Realtime Database (device communication)
         └─→ Cloud Functions (AI features)
```

### 2. **Authentication Flow**

```
User Opens App
   │
   ├─→ Check auth.currentUser
   │     │
   │     ├─→ NOT AUTHENTICATED
   │     │     └─→ Navigate to (auth)/sign-in.tsx
   │     │           │
   │     │           └─→ User enters email/password
   │     │                 │
   │     │                 └─→ signInWithEmailAndPassword()
   │     │                       │
   │     │                       ├─→ Check if device linked
   │     │                       │     │
   │     │                       │     ├─→ Has device → Navigate to (tabs)/
   │     │                       │     └─→ No device → Navigate to (device)/link
   │     │                       │
   │     │                       └─→ Auth state persists in AsyncStorage
   │     │
   │     └─→ AUTHENTICATED
   │           └─→ Navigate to (tabs)/index.tsx (Home)
```

### 3. **Home Screen Data Flow (Medication Management)**

```
Home Screen (index.tsx)
   │
   ├─→ Real-time Subscription
   │     └─→ onSnapshot(query(collection(db, "users", uid, "schedule")))
   │           └─→ Automatically updates when medications change
   │
   ├─→ Add Medication Flow
   │     │
   │     ├─→ User types medication name
   │     │     └─→ useMedicationSuggestions hook
   │     │           └─→ Calls Cloud Function: getMedicationSuggestions
   │     │                 └─→ OpenAI API → Returns suggestions
   │     │
   │     ├─→ User submits form
   │     │     │
   │     │     ├─→ 1. Allergy Check
   │     │     │       └─→ useMedicationSafety.checkAllergy()
   │     │     │             └─→ Cloud Function: checkMedicationAllergy
   │     │     │                   └─→ OpenAI API → Returns allergy status
   │     │     │
   │     │     ├─→ 2. Drug Interaction Check
   │     │     │       └─→ useMedicationSafety.checkInteraction()
   │     │     │             └─→ Cloud Function: checkDrugInteraction
   │     │     │                   └─→ OpenAI API → Returns interaction status
   │     │     │
   │     │     └─→ 3. If safe, save to Firestore
   │     │           └─→ addDoc(collection(db, "users", uid, "schedule"))
   │     │                 └─→ Triggers onSnapshot → Updates UI automatically
   │
   └─→ Notification Scheduling
         └─→ useEffect watches doses array
               └─→ scheduleDoseNotification() for each enabled medication
                     └─→ expo-notifications → Schedules daily reminders
```

### 4. **Notification → Auto-Dispense Flow**

```
Notification Received
   │
   ├─→ Notifications.addNotificationReceivedListener()
   │     │
   │     └─→ Check if "Time to take your dose" notification
   │           │
   │           ├─→ rotateMotor(45) → Rotates device motor
   │           │     └─→ set(ref(rtdb, `devices/${PIN}/motorRotate`))
   │           │           └─→ Device listens and rotates motor
   │           │
   │           └─→ autoTriggerDispense()
   │                 │
   │                 ├─→ Safety checks (allergies, block status)
   │                 │
   │                 └─→ set(ref(rtdb, `devices/${PIN}/dispense`), true)
   │                       └─→ Device listens and dispenses pills
```

### 5. **Chat Feature Flow**

```
Chat Screen (chat.tsx)
   │
   ├─→ Load user medications on mount
   │     └─→ getDocs(collection(db, "users", uid, "schedule"))
   │           └─→ Extract medication names
   │
   ├─→ User sends message
   │     │
   │     └─→ httpsCallable(functions, "chatWithMedicationAI")
   │           │
   │           ├─→ Cloud Function: chatWithMedicationAI
   │           │     │
   │           │     ├─→ Builds system prompt with user's medications
   │           │     │
   │           │     └─→ OpenAI API (gpt-3.5-turbo)
   │           │           └─→ Returns AI response
   │           │
   │           └─→ Display response in chat UI
```

### 6. **Device Linking Flow**

```
Link Device Screen (link.tsx)
   │
   ├─→ Listen for available devices
   │     └─→ onValue(ref(rtdb, "devices"))
   │           └─→ Filters devices with status: "WAITING_FOR_PAIR"
   │
   ├─→ User enters PIN
   │     │
   │     └─→ Verify device exists and is waiting
   │           │
   │           ├─→ Check device in Realtime Database
   │           │
   │           └─→ Link device to user
   │                 │
   │                 ├─→ setDoc(collection(db, "users", uid, "devices"))
   │                 │     └─→ Stores device PIN in Firestore
   │                 │
   │                 └─→ set(ref(rtdb, `devices/${PIN}/status`), "LINKED")
   │                       └─→ Updates device status
```

---

## 🔌 Key Connections

### **Context Providers (Global State)**

All screens access these contexts via hooks:

```typescript
// Theme Context
const { isDark, theme, setTheme } = useTheme();
const colors = getThemeColors(isDark, highContrast);

// Language Context
const { t, language, setLanguage } = useLanguage();
// Use: t('hello') → Returns translated string

// Accessibility Context
const { 
  getScaledFontSize, 
  getScaledSpacing, 
  highContrast, 
  simplifiedMode 
} = useAccessibility();
```

### **Firebase Services**

```typescript
// Authentication
auth → Firebase Auth
  ├─→ Sign in/up
  ├─→ Current user state
  └─→ Persists in AsyncStorage

// Firestore (NoSQL Database)
db → Firestore
  ├─→ users/{uid}/schedule → Medication schedules
  ├─→ users/{uid}/devices → Linked devices
  └─→ users/{uid} → User profile & allergies

// Realtime Database (Real-time device communication)
rtdb → Realtime Database
  ├─→ devices/{PIN}/dispense → Dispense commands
  ├─→ devices/{PIN}/motorRotate → Motor control
  └─→ devices/{PIN}/status → Device status

// Cloud Functions (Server-side logic)
functions → Firebase Functions
  ├─→ chatWithMedicationAI → AI chat
  ├─→ checkMedicationAllergy → Allergy checking
  ├─→ checkDrugInteraction → Interaction checking
  └─→ getMedicationSuggestions → Medication suggestions
```

### **Custom Hooks (Reusable Logic)**

```typescript
// Medication Safety
useMedicationSafety()
  ├─→ checkAllergy() → Calls Cloud Function
  ├─→ checkInteraction() → Calls Cloud Function
  └─→ getUserAllergies() → Reads from Firestore

// Medication Suggestions
useMedicationSuggestions(query, enabled)
  └─→ Calls getMedicationSuggestions Cloud Function
      └─→ Returns AI-powered suggestions

// Motor Control
rotateMotor(angle)
  ├─→ Gets device PIN from Firestore
  └─→ Sends command to Realtime Database

// Notifications
scheduleDoseNotification() → Schedules daily reminders
cancelAllDoseNotifications() → Cancels all reminders
```

---

## 🎯 Feature-Specific Connections

### **1. Medication Scheduling**

```
User Input → Form Validation
   │
   ├─→ AI Suggestions (as user types)
   │     └─→ useMedicationSuggestions → Cloud Function → OpenAI
   │
   ├─→ Safety Checks (on submit)
   │     ├─→ Allergy Check → Cloud Function → OpenAI
   │     └─→ Interaction Check → Cloud Function → OpenAI
   │
   ├─→ Save to Firestore
   │     └─→ addDoc(collection(db, "users", uid, "schedule"))
   │
   └─→ Auto-update UI
         └─→ onSnapshot listener → Updates doses state
```

### **2. Notifications System**

```
Medication Added/Updated
   │
   └─→ useEffect watches doses array
         │
         ├─→ Cancel existing notifications
         │
         └─→ Schedule new notifications
               └─→ scheduleDoseNotification() for each enabled dose
                     └─→ expo-notifications → Daily recurring reminders
```

### **3. Device Integration**

```
Manual Dispense Button
   │
   ├─→ Safety checks (allergies, block status)
   │
   └─→ set(ref(rtdb, `devices/${PIN}/dispense`), true)
         └─→ Device Arduino code listens and dispenses

Auto-Dispense (on notification)
   │
   ├─→ Notification received
   │
   ├─→ rotateMotor(45) → Rotates motor
   │
   └─→ autoTriggerDispense() → Dispenses with safety checks
```

### **4. AI Chat**

```
User Message
   │
   ├─→ Load user medications from Firestore
   │
   └─→ httpsCallable(functions, "chatWithMedicationAI")
         │
         ├─→ Cloud Function receives:
         │     ├─→ Message history
         │     └─→ User's medications list
         │
         └─→ OpenAI API
               └─→ Returns AI response
                     └─→ Displayed in chat UI
```

---

## 🔄 Real-Time Updates

The app uses **Firebase real-time listeners** for automatic UI updates:

1. **Medication Schedule**: `onSnapshot()` on Firestore collection
   - Automatically updates when medications are added/edited/deleted
   - No manual refresh needed

2. **Device Status**: `onValue()` on Realtime Database
   - Monitors device pairing status
   - Updates available devices list in real-time

---

## 📱 Navigation Flow

```
App Start
   │
   ├─→ Check auth.currentUser
   │     │
   │     ├─→ null → (auth)/sign-in.tsx
   │     │           │
   │     │           ├─→ Sign in → Check device
   │     │           │     │
   │     │           │     ├─→ Has device → (tabs)/
   │     │           │     └─→ No device → (device)/link
   │     │           │
   │     │           └─→ Sign up → (auth)/allergy-form → (device)/link
   │     │
   │     └─→ authenticated → (tabs)/
   │                           │
   │                           ├─→ index.tsx (Home)
   │                           ├─→ chat.tsx (AI Chat)
   │                           ├─→ profile.tsx (Profile)
   │                           └─→ settings.tsx (Settings)
```

---

## 🎨 Styling System

```
DesignSystem (constants/DesignSystem.ts)
   │
   ├─→ getThemeColors(isDark, highContrast)
   │     └─→ Returns color palette based on theme
   │
   ├─→ Typography, spacing, shadows, etc.
   │
   └─→ All components use these constants
         └─→ Ensures consistent design across app
```

---

## 🔐 Security & Data Flow

1. **Authentication**: Firebase Auth handles all authentication
2. **Authorization**: Firestore rules control data access
3. **Cloud Functions**: All AI calls go through authenticated functions
4. **Device Communication**: Realtime Database with device PIN authentication

---

## 🧩 Component Hierarchy

```
RootLayout (_layout.tsx)
   │
   ├─→ ThemeProvider
   │     │
   │     └─→ LanguageProvider
   │           │
   │           └─→ AccessibilityProvider
   │                 │
   │                 └─→ Stack Navigator
   │                       │
   │                       ├─→ (auth)/ screens
   │                       ├─→ (device)/ screens
   │                       └─→ (tabs)/ screens
   │                             │
   │                             └─→ Tabs Navigator
   │                                   │
   │                                   ├─→ Home (index.tsx)
   │                                   │     ├─→ DoseCard components
   │                                   │     ├─→ Tutorial component
   │                                   │     └─→ Uses hooks for safety/suggestions
   │                                   │
   │                                   ├─→ Chat (chat.tsx)
   │                                   │     └─→ Calls Cloud Functions
   │                                   │
   │                                   ├─→ Profile (profile.tsx)
   │                                   │
   │                                   └─→ Settings (settings.tsx)
```

---

## 💡 Key Design Patterns

1. **Context API**: Global state (theme, language, accessibility)
2. **Custom Hooks**: Reusable logic (safety checks, suggestions, notifications)
3. **Real-time Listeners**: Automatic UI updates (Firestore onSnapshot, RTDB onValue)
4. **Cloud Functions**: Server-side AI processing
5. **File-based Routing**: Expo Router handles navigation automatically

---

This architecture ensures:
- ✅ Separation of concerns
- ✅ Reusable components and hooks
- ✅ Real-time data synchronization
- ✅ Type safety with TypeScript
- ✅ Consistent theming and internationalization
- ✅ Secure authentication and data access
