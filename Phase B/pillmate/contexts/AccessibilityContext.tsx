/**
 * Accessibility Context
 * 
 * Manages accessibility settings including text size, high contrast mode,
 * and simplified mode. Provides helper functions to scale fonts and spacing
 * based on user preferences. Settings are persisted to AsyncStorage.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TextSize = 'small' | 'medium' | 'large' | 'extra-large';
export type AccessibilityMode = 'standard' | 'simplified';

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  simplifiedMode: boolean;
  setSimplifiedMode: (enabled: boolean) => void;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  // Helper functions
  getScaledFontSize: (baseSize: number) => number;
  getScaledSpacing: (baseSpacing: number) => number;
  getMinTouchTarget: () => number;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);
const ACCESSIBILITY_STORAGE_KEY = '@pillmate_accessibility';

// Text size multipliers for scaling fonts based on user preference
const TEXT_SIZE_MULTIPLIERS: Record<TextSize, number> = {
  'small': 0.9,
  'medium': 1.0,
  'large': 1.3,
  'extra-large': 1.6,
};

// Spacing multipliers for larger touch targets when text size increases
const SPACING_MULTIPLIERS: Record<TextSize, number> = {
  'small': 1.0,
  'medium': 1.0,
  'large': 1.2,
  'extra-large': 1.4,
};

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>('medium');
  const [highContrast, setHighContrastState] = useState(false);
  const [simplifiedMode, setSimplifiedModeState] = useState(false);
  const [showTutorial, setShowTutorialState] = useState(false);

  // Load accessibility settings from storage on mount
  useEffect(() => {
    loadAccessibilitySettings();
  }, []);

  const loadAccessibilitySettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.textSize) setTextSizeState(settings.textSize);
        if (settings.highContrast !== undefined) setHighContrastState(settings.highContrast);
        if (settings.simplifiedMode !== undefined) setSimplifiedModeState(settings.simplifiedMode);
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  };

  const setTextSize = async (size: TextSize) => {
    try {
      const current = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      const settings = current ? JSON.parse(current) : {};
      settings.textSize = size;
      await AsyncStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
      setTextSizeState(size);
    } catch (error) {
      console.error('Failed to save text size:', error);
      setTextSizeState(size);
    }
  };

  const setHighContrast = async (enabled: boolean) => {
    try {
      const current = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      const settings = current ? JSON.parse(current) : {};
      settings.highContrast = enabled;
      await AsyncStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
      setHighContrastState(enabled);
    } catch (error) {
      console.error('Failed to save high contrast:', error);
      setHighContrastState(enabled);
    }
  };

  const setSimplifiedMode = async (enabled: boolean) => {
    try {
      const current = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      const settings = current ? JSON.parse(current) : {};
      settings.simplifiedMode = enabled;
      await AsyncStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
      setSimplifiedModeState(enabled);
    } catch (error) {
      console.error('Failed to save simplified mode:', error);
      setSimplifiedModeState(enabled);
    }
  };

  /**
   * Scale font size based on user's text size preference
   * @param baseSize - Base font size in pixels
   * @returns Scaled font size
   */
  const getScaledFontSize = (baseSize: number): number => {
    return Math.round(baseSize * TEXT_SIZE_MULTIPLIERS[textSize]);
  };

  /**
   * Scale spacing based on user's text size preference
   * @param baseSpacing - Base spacing value in pixels
   * @returns Scaled spacing value
   */
  const getScaledSpacing = (baseSpacing: number): number => {
    return Math.round(baseSpacing * SPACING_MULTIPLIERS[textSize]);
  };

  /**
   * Get minimum touch target size based on text size and simplified mode
   * WCAG recommends 44x44px minimum for accessibility
   * @returns Minimum touch target size in pixels
   */
  const getMinTouchTarget = (): number => {
    // Extra-large text or simplified mode needs larger touch targets
    if (textSize === 'extra-large' || simplifiedMode) return 56;
    if (textSize === 'large') return 48;
    return 44; // WCAG minimum
  };

  // setShowTutorial doesn't need to be persisted, it's just UI state
  const setShowTutorial = (show: boolean) => {
    setShowTutorialState(show);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        highContrast,
        setHighContrast,
        simplifiedMode,
        setSimplifiedMode,
        showTutorial,
        setShowTutorial,
        getScaledFontSize,
        getScaledSpacing,
        getMinTouchTarget,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
