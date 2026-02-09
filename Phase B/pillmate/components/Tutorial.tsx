/**
 * Tutorial Component
 * 
 * Displays an interactive step-by-step tutorial modal that guides users
 * through the app's features. Shows explanations for each major feature
 * with navigation between steps. Includes a medical disclaimer at the end.
 */
import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface TutorialProps {
  visible: boolean;
  onClose: () => void;
}

export default function Tutorial({ visible, onClose }: TutorialProps) {
  const { isDark } = useTheme();
  const { getScaledFontSize, getMinTouchTarget } = useAccessibility();
  const [currentStep, setCurrentStep] = useState(0);
  const minTouchTarget = getMinTouchTarget();

  // Reset step when modal closes
  useEffect(() => {
    if (!visible) {
      setCurrentStep(0);
    }
  }, [visible]);

  // Tutorial steps with explanations for each feature
  const explanations = [
    {
      title: 'Home Screen',
      text: 'This is your home screen where you manage all your medications.',
    },
    {
      title: 'Add Medication Button',
      text: 'Tap "Add New Medication" to add a medication. Enter the name, number of pills, and time.',
    },
    {
      title: 'Medication Name',
      text: 'Type the name of your medication here, like "Aspirin" or "Vitamin D".',
    },
    {
      title: 'Number of Pills',
      text: 'Enter how many pills you need to take, like "1" or "2".',
    },
    {
      title: 'Time Picker',
      text: 'Tap the time button to select when to take your medication. Choose hour and minute.',
    },
    {
      title: 'Medication Cards',
      text: 'Each medication appears as a card showing the name, time, and number of pills.',
    },
    {
      title: 'Edit Button',
      text: 'Tap the pencil icon to edit a medication. You can change the name, dose, or time.',
    },
    {
      title: 'Delete Button',
      text: 'Tap the trash icon to remove a medication from your schedule.',
    },
    {
      title: 'Toggle Button',
      text: 'Use the ON/OFF button to enable or disable a medication reminder.',
    },
    {
      title: 'Help Button',
      text: 'The question mark button in the top right opens this help guide.',
    },
    {
      title: 'Settings',
      text: 'Go to Settings tab to make text bigger, enable high contrast, or turn on simplified mode.',
    },
    {
      title: 'Important Medical Disclaimer',
      text: 'This application is for demonstration purposes only. Always consult with your doctor or healthcare provider before making any decisions about your medications, dosages, or treatment plans. The app is not responsible for any medical decisions or outcomes. The information provided in this app should not replace professional medical advice, diagnosis, or treatment.',
    },
  ];

  const totalSteps = explanations.length;
  const current = explanations[currentStep];
  // Check if we're on the medical disclaimer step (last step)
  const isDisclaimerStep = currentStep === totalSteps - 1;

  /**
   * Navigate to next tutorial step or close if on last step
   */
  const next = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  /**
   * Navigate to previous tutorial step
   */
  const previous = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const bgColor = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryColor = isDark ? '#CCCCCC' : '#666666';

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
      onDismiss={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.box, { backgroundColor: bgColor }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { 
              color: isDisclaimerStep ? '#FF6B35' : textColor, 
              fontSize: getScaledFontSize(22) 
            }]}>
              {current.title}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: textColor, fontSize: getScaledFontSize(24) }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.text, { 
            color: isDisclaimerStep ? (isDark ? '#FFB8A3' : '#CC4A2E') : secondaryColor, 
            fontSize: getScaledFontSize(18), 
            lineHeight: getScaledFontSize(28),
            fontWeight: isDisclaimerStep ? '500' : '400'
          }]}>
            {current.text}
          </Text>

          <Text style={[styles.counter, { color: secondaryColor, fontSize: getScaledFontSize(14) }]}>
            {currentStep + 1} / {totalSteps}
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.prevButton,
                { 
                  backgroundColor: currentStep === 0 ? (isDark ? '#2D3748' : '#E5E7EB') : (isDark ? '#374151' : '#F3F4F6'),
                  minHeight: minTouchTarget,
                  opacity: currentStep === 0 ? 0.5 : 1,
                }
              ]}
              onPress={previous}
              disabled={currentStep === 0}
            >
              <Text style={[styles.buttonText, { 
                color: currentStep === 0 ? secondaryColor : textColor,
                fontSize: getScaledFontSize(16),
              }]}>
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.nextButton,
                { 
                  backgroundColor: '#4A90E2',
                  minHeight: minTouchTarget,
                  flex: 1,
                }
              ]}
              onPress={() => {
                if (currentStep === totalSteps - 1) {
                  handleClose();
                } else {
                  next();
                }
              }}
            >
              <Text style={[styles.buttonText, { 
                color: '#FFFFFF',
                fontSize: getScaledFontSize(16),
                fontWeight: '700',
              }]}>
                {currentStep === totalSteps - 1 ? 'Done' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: '800',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontWeight: 'bold',
  },
  text: {
    fontWeight: '400',
    marginBottom: 20,
  },
  counter: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  prevButton: {
  },
  nextButton: {
    flex: 1,
  },
  buttonText: {
    fontWeight: '600',
  },
});
