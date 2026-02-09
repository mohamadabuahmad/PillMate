/**
 * Medication Safety Hook
 * 
 * Provides safety checks for medications including:
 * - Allergy verification against user's known allergies
 * - Drug interaction checking between medications
 * 
 * Uses Firebase Cloud Functions to perform AI-powered safety checks.
 */
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

/**
 * Hook for medication safety checks
 * 
 * @returns Object with checking state and safety check functions
 */
export function useMedicationSafety() {
  const [checking, setChecking] = useState(false);

  /**
   * Get user's allergies from Firestore
   * 
   * @param uid - User ID
   * @returns Promise<string[]> - Array of allergy names
   */
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

  /**
   * Check if a medication conflicts with user's known allergies
   * 
   * Uses AI-powered Cloud Function to check for potential allergic reactions.
   * 
   * @param medicationName - Name of the medication to check
   * @param userAllergies - Array of user's known allergies
   * @returns Promise<AllergyCheckResult> - Result with allergy status and severity
   */
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

  /**
   * Check for drug interactions between two medications
   * 
   * Uses AI-powered Cloud Function to check for potential interactions.
   * Can also check if medications need time gaps between doses.
   * 
   * @param medication1 - First medication name
   * @param medication2 - Second medication name
   * @param medication1Time - Time when first medication is taken (optional)
   * @param medication2Time - Time when second medication is taken (optional)
   * @returns Promise<DrugInteractionResult> - Result with interaction status and recommendations
   */
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
