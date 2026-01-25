import { ref, set } from "firebase/database";
import { collection, getDocs } from "firebase/firestore";
import { rtdb, db, auth } from "../src/firebase";

/**
 * Rotate the device motor by a specified angle (in degrees)
 * @param angle - The angle to rotate the motor (default: 45 degrees)
 */
export async function rotateMotor(angle: number = 45): Promise<boolean> {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.error("User not authenticated");
      return false;
    }

    // Get device PIN
    const devicesRef = collection(db, "users", uid, "devices");
    const snapshot = await getDocs(devicesRef);
    
    if (snapshot.empty) {
      console.error("No device linked");
      return false;
    }

    const deviceData = snapshot.docs[0].data();
    const devicePIN = deviceData.devicePIN;
    
    if (!devicePIN) {
      console.error("Device PIN not found");
      return false;
    }

    // Send motor rotation command to Firebase Realtime Database
    const motorRef = ref(rtdb, `devices/${devicePIN}/motorRotate`);
    await set(motorRef, {
      angle: angle,
      timestamp: Date.now(),
      executed: false, // Device will set this to true after executing
    });

    console.log(`Motor rotation command sent: ${angle} degrees`);
    return true;
  } catch (error) {
    console.error("Error sending motor rotation command:", error);
    return false;
  }
}
