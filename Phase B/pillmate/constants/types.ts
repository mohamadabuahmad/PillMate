export type Dose = {
  id: string;
  medName: string;
  dose: string;
  time: string; // "HH:MM"
  enabled: boolean;
};

export type Device = {
  deviceId: string;
  ownerUid: string;
  lastSeen?: any;
};

export type DeviceSlot = {
  slotNumber: number; // 1-7
  medicationName: string | null;
  pillCount: number;
  maxCapacity: number; // Maximum pills this slot can hold
  lastRefilled?: string; // ISO date string
  lowThreshold: number; // Alert when pills reach this count
};

export type DeviceSlots = {
  [key: number]: DeviceSlot; // Key is slot number (1-7)
};
