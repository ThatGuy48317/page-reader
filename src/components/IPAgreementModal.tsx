import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface IPAgreementModalProps {
  visible: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export function IPAgreementModal({ visible, onAccept, onCancel }: IPAgreementModalProps) {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);

  const allChecked = checked1 && checked2 && checked3;

  const handleAccept = () => {
    if (allChecked) {
      onAccept();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Intellectual Property Compliance</Text>
          <Text style={styles.subtitle}>
            To protect authors and publishers under 17 U.S.C. § 107/121 Fair Use, please confirm your lawful ownership:
          </Text>

          <ScrollView contentContainerStyle={styles.checkboxContainer} showsVerticalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.checkboxItem, checked1 && styles.checkboxItemChecked]} 
              onPress={() => setChecked1(!checked1)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, checked1 && styles.checkboxBoxChecked]}>
                {checked1 && <Ionicons name="checkmark" size={14} color="#000000" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I own a lawful physical copy of this book, or have legally borrowed it from a library.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.checkboxItem, checked2 && styles.checkboxItemChecked]} 
              onPress={() => setChecked2(!checked2)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, checked2 && styles.checkboxBoxChecked]}>
                {checked2 && <Ionicons name="checkmark" size={14} color="#000000" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I will use this format-shifted audio narration solely for personal study, private research, or accessibility.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.checkboxItem, checked3 && styles.checkboxItemChecked]} 
              onPress={() => setChecked3(!checked3)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, checked3 && styles.checkboxBoxChecked]}>
                {checked3 && <Ionicons name="checkmark" size={14} color="#000000" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree not to share, copy, distribute, publicly perform, or sell the generated audio files.
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.acceptButton, !allChecked && styles.acceptButtonDisabled]} 
              onPress={handleAccept}
              disabled={!allChecked}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={16} color="#000000" style={{ marginRight: 6 }} />
              <Text style={styles.acceptButtonText}>Confirm & Digitize</Text>
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(226, 179, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 179, 80, 0.25)',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    lineHeight: 18,
  },
  checkboxContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxItemChecked: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(226, 179, 80, 0.08)',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 1,
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.text,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.4,
  },
  acceptButtonText: {
    color: '#000000',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
