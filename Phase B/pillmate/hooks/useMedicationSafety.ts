import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { onAuthStateChanged } from "firebase/auth";
import { functions, auth } from "../src/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/firebase";

interface AllergyCheckResult {
  hasAllergy: boolean;
  severity: string;
  message: string;
  shouldBlock: boolean;
}

interface DrugInteractionResult {
  canTakeTogether: boolean;
  interactionLevel: string;
  timeGapRequired: number;
  message: string;
  recommendation: string;
}

export function useMedicationSafety() {
  const [checking, setChecking] = useState(false);

  // Get user's allergies from Firestore
  const getUserAllergies = async (uid: string): Promise<string[]> => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data().allergies || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching allergies:", error);
      return [];
    }
  };

  // Helper to wait for auth to be ready
  const waitForAuth = async (): Promise<boolean> => {
    if (auth.currentUser) {
      return true;
    }

    return new Promise<boolean>((resolve) => {
      let resolved = false;

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && !resolved) {
          resolved = true;
          unsubscribe();
          resolve(true);
        }
      });

      if (auth.currentUser) {
        resolved = true;
        unsubscribe();
        resolve(true);
        return;
      }

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unsubscribe();
          resolve(false);
        }
      }, 3000);
    });
  };

  // Check if medication conflicts with allergies
  const checkAllergy = async (
    medicationName: string,
    userAllergies: string[]
  ): Promise<AllergyCheckResult> => {
    if (!userAllergies || userAllergies.length === 0) {
      return {
        hasAllergy: false,
        severity: "none",
        message: "",
        shouldBlock: false,
      };
    }

    const authReady = await waitForAuth();
    if (!authReady || !auth.currentUser) {
      return {
        hasAllergy: false,
        severity: "none",
        message: "Please sign in to verify allergies.",
        shouldBlock: false,
      };
    }

    setChecking(true);
    try {
      const checkFunction = httpsCallable(functions, "checkMedicationAllergy");
      const result = await checkFunction({
        medicationName,
        userAllergies,
      });
      return result.data as AllergyCheckResult;
    } catch (error: any) {
      console.error("Allergy check error:", error);
      return {
        hasAllergy: false,
        severity: "none",
        message: "Unable to verify. Please consult your doctor.",
        shouldBlock: false,
      };
    } finally {
      setChecking(false);
    }
  };

  // Check drug interactions
  const checkInteraction = async (
    medication1: string,
    medication2: string,
    medication1Time?: string,
    medication2Time?: string
  ): Promise<DrugInteractionResult> => {
    const authReady = await waitForAuth();
    if (!authReady || !auth.currentUser) {
      return {
        canTakeTogether: true,
        interactionLevel: "none",
        timeGapRequired: 0,
        message: "Please sign in to verify interactions.",
        recommendation: "take_together",
      };
    }

    setChecking(true);
    try {
      const checkFunction = httpsCallable(functions, "checkDrugInteraction");
      const result = await checkFunction({
        medication1,
        medication2,
        medication1Time,
        medication2Time,
      });
      return result.data as DrugInteractionResult;
    } catch (error: any) {
      console.error("Interaction check error:", error);
      return {
        canTakeTogether: true,
        interactionLevel: "none",
        timeGapRequired: 0,
        message: "Unable to verify. Please consult your doctor.",
        recommendation: "take_together",
      };
    } finally {
      setChecking(false);
    }
  };

  return {
    checking,
    checkAllergy,
    checkInteraction,
    getUserAllergies,
  };
}
