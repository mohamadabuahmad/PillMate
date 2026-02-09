/**
 * Type Definitions
 * 
 * Centralized type definitions for the PillMate app.
 * These types are used throughout the application for type safety.
 */

/**
 * Medication dose/schedule entry
 */
export type Dose = {
  id: string;                    // Unique identifier from Firestore
  medName: string;                // Medication name
  dose: string;                   // Number of pills/dose
  time: string;                   // Time in "HH:MM" format
  enabled: boolean;               // Whether reminder is enabled
};

/**
 * Physical device information
 */
export type Device = {
  deviceId: string;               // Device identifier
  ownerUid: string;              // User ID of device owner
  lastSeen?: any;                 // Last seen timestamp
};

/**
 * Individual device slot configuration
 * Each device has 7 slots (numbered 1-7)
 */
export type DeviceSlot = {
  slotNumber: number;             // Slot number (1-7)
  medicationName: string | null;    // Medication assigned to this slot
  pillCount: number;              // Current number of pills in slot
  maxCapacity: number;             // Maximum pills this slot can hold
  lastRefilled?: string;          // ISO date string of last refill
  lowThreshold: number;           // Alert when pills reach this count
};

/**
 * Collection of device slots
 * Key is the slot number (1-7)
 */
export type DeviceSlots = {
  [key: number]: DeviceSlot;       // Key is slot number (1-7)
};
