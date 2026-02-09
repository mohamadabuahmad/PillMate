/**
 * Motor Control Hook
 * 
 * Provides functionality to control the physical device motor.
 * Sends rotation commands to the device via Firebase Realtime Database.
 */
import { ref, set } from "firebase/database";
import { collection, getDocs } from "firebase/firestore";
import { rtdb, db, auth } from "../src/firebase";

/**
 * Rotate the device motor by a specified angle (in degrees)
 * 
 * This function:
 * 1. Gets the user's linked device PIN from Firestore
 * 2. Sends a rotation command to the device via Realtime Database
 * 3. The device listens for this command and executes the rotation
 * 
 * @param angle - The angle to rotate the motor in degrees (default: 45 degrees)
 * @returns Promise<boolean> - true if command sent successfully, false otherwise
 */
export async function rotateMotor(angle: number = 45): Promise<boolean> {
  try {
    // Check if user is authenticated
    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.error("User not authenticated");
      return false;
    }

    // Get device PIN from user's linked devices in Firestore
    const devicesRef = collection(db, "users", uid, "devices");
    const snapshot = await getDocs(devicesRef);
    
    if (snapshot.empty) {
      console.error("No device linked");
      return false;
    }

    // Get the first linked device's PIN
    const deviceData = snapshot.docs[0].data();
    const devicePIN = deviceData.devicePIN;
    
    if (!devicePIN) {
      console.error("Device PIN not found");
      return false;
    }

    // Send motor rotation command to Firebase Realtime Database
    // The device listens to this path and executes the rotation
    const motorRef = ref(rtdb, `devices/${devicePIN}/motorRotate`);
    await set(motorRef, {
      angle: angle,
      timestamp: Date.now(),
      executed: false, // Device will set this to true after executing the rotation
    });

    console.log(`Motor rotation command sent: ${angle} degrees`);
    return true;
  } catch (error) {
    console.error("Error sending motor rotation command:", error);
    return false;
  }
}
