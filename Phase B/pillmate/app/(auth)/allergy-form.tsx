import { router } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignSystem } from '../../constants/DesignSystem';
import { auth, db } from '../../src/firebase';

export default function AllergyFormSignup() {
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [hasAllergies, setHasAllergies] = useState(false);

  const addAllergy = () => {
    const trimmed = newAllergy.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
      setNewAllergy('');
      setHasAllergies(true);
    } else if (allergies.includes(trimmed)) {
      Alert.alert('Duplicate', 'This allergy is already in your list.');
    }
  };

  const removeAllergy = (allergy: string) => {
    const updated = allergies.filter(a => a !== allergy);
    setAllergies(updated);
    if (updated.length === 0) {
      setHasAllergies(false);
    }
  };

  const handleContinue = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'You must be signed in.');
      return;
    }

    try {
      // Save allergies (even if empty array - means no allergies)
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        allergies: allergies,
        allergiesCompleted: true,
        allergiesUpdatedAt: new Date().toISOString(),
      }, { merge: true });

      // Continue to device link
      router.replace('/(device)/link' as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save allergies');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: DesignSystem.colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: DesignSystem.colors.textPrimary }]}>Allergy Information</Text>
          <Text style={[styles.subtitle, { color: DesignSystem.colors.textSecondary }]}>
            This information helps us keep you safe. You can skip if you have no allergies.
          </Text>
        </View>

        <View style={[styles.switchContainer, { backgroundColor: DesignSystem.colors.surface }]}>
          <Text style={[styles.switchLabel, { color: DesignSystem.colors.textPrimary }]}>I have medication allergies</Text>
          <Switch 
            value={hasAllergies} 
            onValueChange={setHasAllergies}
            trackColor={{ false: DesignSystem.colors.border, true: DesignSystem.colors.primary }}
            thumbColor={hasAllergies ? '#fff' : '#f4f3f4'}
          />
        </View>

        {hasAllergies && (
          <>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: DesignSystem.colors.surface, color: DesignSystem.colors.textPrimary, borderColor: DesignSystem.colors.border }]}
                placeholder="Enter allergy (e.g., Penicillin, Aspirin)"
                placeholderTextColor={DesignSystem.colors.textTertiary}
                value={newAllergy}
                onChangeText={setNewAllergy}
                onSubmitEditing={addAllergy}
                returnKeyType="done"
                autoCapitalize="words"
              />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: DesignSystem.colors.primary }]} onPress={addAllergy} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {allergies.length > 0 && (
              <View style={styles.allergyList}>
                <Text style={[styles.listTitle, { color: DesignSystem.colors.textPrimary }]}>Your Allergies:</Text>
                {allergies.map((allergy, index) => (
                  <View key={index} style={[styles.allergyItem, { backgroundColor: DesignSystem.colors.surface }]}>
                    <Text style={[styles.allergyText, { color: DesignSystem.colors.textPrimary }]}>⚠️ {allergy}</Text>
                    <TouchableOpacity onPress={() => removeAllergy(allergy)} style={styles.removeBtn} activeOpacity={0.7}>
                      <Text style={[styles.removeBtnText, { color: DesignSystem.colors.error }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {allergies.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: DesignSystem.colors.textSecondary }]}>No allergies added yet</Text>
                <Text style={[styles.emptySubtext, { color: DesignSystem.colors.textTertiary }]}>Add your allergies above</Text>
              </View>
            )}
          </>
        )}

        <TouchableOpacity style={[styles.continueBtn, { backgroundColor: DesignSystem.colors.primary }]} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: DesignSystem.layout.containerPadding,
    paddingTop: Platform.OS === 'ios' ? DesignSystem.spacing.lg : DesignSystem.spacing['3xl'],
    paddingBottom: DesignSystem.spacing.lg,
  },
  title: { 
    fontSize: DesignSystem.typography.fontSize['3xl'], 
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    marginBottom: DesignSystem.spacing.md,
    letterSpacing: DesignSystem.typography.letterSpacing.tight,
  },
  subtitle: { 
    fontSize: DesignSystem.typography.fontSize.base, 
    lineHeight: DesignSystem.typography.lineHeight.relaxed * DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.regular,
  },
  switchContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: DesignSystem.spacing.lg, 
    padding: DesignSystem.spacing.base, 
    borderRadius: DesignSystem.borderRadius.base,
    marginHorizontal: DesignSystem.layout.containerPadding,
    ...DesignSystem.shadows.sm,
  },
  switchLabel: { 
    fontSize: DesignSystem.typography.fontSize.base, 
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
  inputContainer: { 
    flexDirection: 'row', 
    gap: DesignSystem.spacing.sm, 
    marginBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.layout.containerPadding,
  },
  input: { 
    flex: 1, 
    padding: DesignSystem.layout.inputPadding, 
    borderRadius: DesignSystem.borderRadius.base,
    fontSize: DesignSystem.typography.fontSize.base,
    borderWidth: 1,
    fontWeight: DesignSystem.typography.fontWeight.regular,
    ...DesignSystem.shadows.sm,
  },
  addBtn: { 
    paddingHorizontal: DesignSystem.spacing.lg, 
    paddingVertical: DesignSystem.spacing.md, 
    borderRadius: DesignSystem.borderRadius.base, 
    justifyContent: 'center',
    ...DesignSystem.shadows.md,
  },
  addBtnText: { 
    color: '#fff', 
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
    fontSize: DesignSystem.typography.fontSize.base,
  },
  allergyList: { 
    marginBottom: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.layout.containerPadding,
  },
  listTitle: { 
    fontSize: DesignSystem.typography.fontSize.base, 
    fontWeight: DesignSystem.typography.fontWeight.bold, 
    marginBottom: DesignSystem.spacing.md,
  },
  allergyItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: DesignSystem.spacing.base, 
    borderRadius: DesignSystem.borderRadius.base, 
    marginBottom: DesignSystem.spacing.sm,
    ...DesignSystem.shadows.sm,
  },
  allergyText: { 
    fontSize: DesignSystem.typography.fontSize.base, 
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    flex: 1,
  },
  removeBtn: { 
    padding: DesignSystem.spacing.xs,
  },
  removeBtnText: { 
    fontSize: DesignSystem.typography.fontSize.xl, 
    fontWeight: DesignSystem.typography.fontWeight.extrabold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing['3xl'],
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  emptyText: {
    fontSize: DesignSystem.typography.fontSize.base,
    marginBottom: DesignSystem.spacing.xs,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  emptySubtext: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.regular,
  },
  continueBtn: { 
    padding: DesignSystem.spacing.lg, 
    borderRadius: DesignSystem.borderRadius.base, 
    alignItems: 'center', 
    marginTop: DesignSystem.spacing.lg, 
    marginBottom: DesignSystem.spacing['3xl'],
    marginHorizontal: DesignSystem.layout.containerPadding,
    ...DesignSystem.shadows.md,
  },
  continueBtnText: { 
    color: '#fff', 
    fontWeight: DesignSystem.typography.fontWeight.extrabold, 
    fontSize: DesignSystem.typography.fontSize.lg,
  },
});