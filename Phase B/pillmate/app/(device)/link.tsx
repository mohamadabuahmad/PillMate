import { router, useLocalSearchParams } from "expo-router";
import { get, off, onValue, ref, set } from "firebase/database";
import { collection, getDocs, doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db, rtdb } from "../../src/firebase";

export default function LinkDevice() {
  const [pairCode, setPairCode] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const params = useLocalSearchParams();
  const fromSettings = params.fromSettings === 'true';

  // Check if user already has a linked device on mount
  // Skip redirect if coming from settings (allows adding another device or re-linking)
  useEffect(() => {
    const checkForLinkedDevice = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        router.replace("/(auth)/sign-in" as any);
        return;
      }

      try {
        const devicesRef = collection(db, "users", uid, "devices");
        const snapshot = await getDocs(devicesRef);
        
        if (!snapshot.empty && !fromSettings) {
          // User already has a linked device, redirect to home (unless coming from settings)
          router.replace("/(tabs)" as any);
        } else {
          // No device linked OR coming from settings, show the link page
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Error checking for linked device:", error);
        setIsChecking(false);
      }
    };

    checkForLinkedDevice();
  }, [fromSettings]);

  // Listen for devices waiting for pairing
  useEffect(() => {
    // Only listen if user is authenticated
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    const devicesRef = ref(rtdb, "devices");
    
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const devices = snapshot.val();
        const waitingDevices: string[] = [];
        
        // Find all devices with status "WAITING_FOR_PAIR"
        Object.keys(devices).forEach((pin) => {
          if (devices[pin]?.status === "WAITING_FOR_PAIR") {
            waitingDevices.push(pin);
          }
        });
        
        setAvailableDevices(waitingDevices);
      } else {
        setAvailableDevices([]);
      }
    }, (error: any) => {
      console.error("Error listening to devices:", error);
      // Don't show alert for permission errors - user needs to configure Firebase rules
      if (error?.code === "PERMISSION_DENIED") {
        console.warn("Permission denied. Please update Firebase Realtime Database rules.");
      }
    });

    return () => {
      off(devicesRef, "value", unsubscribe);
    };
  }, []);

  const link = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Not signed in", "Please sign in again.");
      router.replace("/(auth)/sign-in" as any);
      return;
    }

    if (!pairCode.trim()) {
      Alert.alert("Missing PIN", "Enter the pairing PIN displayed on your PillMate box.");
      return;
    }

    const pin = pairCode.trim();
    
    // Validate PIN format (6 digits)
    if (!/^\d{6}$/.test(pin)) {
      Alert.alert("Invalid PIN", "Please enter a 6-digit PIN.");
      return;
    }

    setIsLinking(true);

    try {
      // Check if device exists and is waiting for pairing
      const deviceRef = ref(rtdb, `devices/${pin}`);
      const snapshot = await get(deviceRef);

      if (!snapshot.exists()) {
        Alert.alert(
          "Device not found", 
          "No device found with this PIN.\n\nMake sure:\n• The box is powered on\n• The PIN is correctly displayed on the screen\n• The box is connected to WiFi"
        );
        setIsLinking(false);
        return;
      }

      const deviceData = snapshot.val();
      
      if (!deviceData.status || deviceData.status !== "WAITING_FOR_PAIR") {
        if (deviceData.status === "LINKED") {
          if (deviceData.ownerUid === uid) {
            Alert.alert("Already linked", "This device is already linked to your account.");
          } else {
            Alert.alert("Device already linked", "This device is already linked to another account.");
          }
        } else {
          Alert.alert("Device not ready", `Device status: ${deviceData.status || "unknown"}. Please make sure the device is in pairing mode.`);
        }
        setIsLinking(false);
        return;
      }

      // Link the device to this user in RTDB
      const user = auth.currentUser;
      
      // Update device status to LINKED and add owner info
      const updatedDeviceData = {
        ...deviceData,
        status: "LINKED",
        ownerUid: uid,
        ownerEmail: user?.email || "",
        linkedAt: new Date().toISOString(),
      };
      
      await set(deviceRef, updatedDeviceData);

      // Also store device info in Firestore for easy access
      await setDoc(doc(db, "users", uid, "devices", pin), {
        devicePIN: pin,
        status: "LINKED",
        linkedAt: serverTimestamp(),
        model: "M5Stack",
      }, { merge: true });

      // Initialize 7 empty slots for the device
      const slotsRef = ref(rtdb, `devices/${pin}/slots`);
      const initialSlots: any = {};
      for (let i = 1; i <= 7; i++) {
        initialSlots[i] = {
          slotNumber: i,
          medicationName: null,
          pillCount: 0,
          maxCapacity: 100,
          lowThreshold: 10,
        };
      }
      await set(slotsRef, initialSlots);

      Alert.alert("Success!", "Device linked successfully!", [
        { 
          text: "OK", 
          onPress: () => router.replace("/(tabs)" as any) 
        }
      ]);
    } catch (error: any) {
      console.error("Link error:", error);
      
      let errorMessage = "Failed to link device. Please try again.";
      let errorTitle = "Connection failed";
      
      if (error?.code === "PERMISSION_DENIED" || error?.message?.includes("Permission denied")) {
        errorTitle = "Firebase Rules Not Configured";
        errorMessage = 
          "Permission denied. You need to update Firebase Realtime Database rules.\n\n" +
          "Quick fix:\n" +
          "1. Go to Firebase Console\n" +
          "2. Realtime Database → Rules\n" +
          "3. Use the rules from firebase-rules-simple.json\n" +
          "4. Click Publish\n\n" +
          "See FIREBASE_RULES_QUICK_FIX.md for details.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  // Show loading while checking for existing device
  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#111" />
        <Text style={styles.loadingText}>Checking for linked device...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Connect your PillMate box</Text>
      <Text style={styles.p}>
        {fromSettings 
          ? "Add a new device or re-link a device after reset. Enter the 6-digit PIN displayed on your PillMate box screen."
          : "Enter the 6-digit PIN displayed on your PillMate box screen."
        }
      </Text>

      {availableDevices.length > 0 && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {availableDevices.length} device{availableDevices.length > 1 ? "s" : ""} waiting for pairing
          </Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit PIN"
        value={pairCode}
        onChangeText={setPairCode}
        keyboardType="number-pad"
        maxLength={6}
        autoCapitalize="none"
        editable={!isLinking}
      />

      <TouchableOpacity
        style={[styles.btn, isLinking && styles.btnDisabled]}
        onPress={link}
        disabled={isLinking}
      >
        {isLinking ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.btnText}>Link Device</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/(tabs)" as any)}>
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f6f6f6",
  },
  h1: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
  },
  p: {
    marginTop: 8,
    marginBottom: 18,
    color: "#555",
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    color: "#1976d2",
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: "center",
    fontWeight: "700",
  },
  btn: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "white",
    fontWeight: "800",
  },
  skip: {
    marginTop: 14,
    color: "#111",
    fontWeight: "700",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
    fontSize: 14,
  },
});