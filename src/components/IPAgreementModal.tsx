import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
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
          <Text style={styles.title}>🔒 Intellectual Property Agreement</Text>
          <Text style={styles.subtitle}>
            To protect authors and publishers, you must confirm the following before converting this book:
          </Text>

          <ScrollView contentContainerStyle={styles.checkboxContainer}>
            <TouchableOpacity 
              style={[styles.checkboxItem, checked1 && styles.checkboxItemChecked]} 
              onPress={() => setChecked1(!checked1)}
              activeOpacity={0.8}
            >
              <Text style={styles.checkboxIcon}>{checked1 ? '☑️' : '⬛'}</Text>
              <Text style={styles.checkboxLabel}>
                I own a legal, physical copy of this book, or have legally borrowed it from a library.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.checkboxItem, checked2 && styles.checkboxItemChecked]} 
              onPress={() => setChecked2(!checked2)}
              activeOpacity={0.8}
            >
              <Text style={styles.checkboxIcon}>{checked2 ? '☑️' : '⬛'}</Text>
              <Text style={styles.checkboxLabel}>
                I will use this audio narration solely for personal study, private research, or accessibility purposes.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.checkboxItem, checked3 && styles.checkboxItemChecked]} 
              onPress={() => setChecked3(!checked3)}
              activeOpacity={0.8}
            >
              <Text style={styles.checkboxIcon}>{checked3 ? '☑️' : '⬛'}</Text>
              <Text style={styles.checkboxLabel}>
                I agree not to share, copy, distribute, publish, or sell the generated audio files.
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.acceptButton, !allChecked && styles.acceptButtonDisabled]} 
              onPress={handleAccept}
              disabled={!allChecked}
            >
              <Text style={styles.acceptButtonText}>Confirm & Process</Text>
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
    padding: Spacing.lg || 24,
  },
  container: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: Colors.surface || '#1e293b',
    borderRadius: BorderRadius.lg || 16,
    padding: Spacing.lg || 24,
    borderWidth: 1,
    borderColor: Colors.border || '#334155',
  },
  title: {
    fontSize: FontSize.lg || 18,
    fontWeight: 'bold',
    color: Colors.text || '#f8fafc',
    marginBottom: Spacing.md || 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm || 14,
    color: Colors.textSecondary || '#94a3b8',
    marginBottom: Spacing.lg || 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  checkboxContainer: {
    gap: Spacing.md || 16,
    marginBottom: Spacing.xl || 32,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background || '#0f172a',
    borderRadius: BorderRadius.md || 12,
    padding: Spacing.md || 16,
    borderWidth: 1,
    borderColor: Colors.surfaceLight || '#334155',
  },
  checkboxItemChecked: {
    borderColor: Colors.primary || '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.05)',
  },
  checkboxIcon: {
    fontSize: 20,
    marginRight: Spacing.md || 12,
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: FontSize.sm || 14,
    color: Colors.text || '#f8fafc',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md || 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md || 16,
    borderRadius: BorderRadius.md || 12,
    backgroundColor: Colors.surfaceLight || '#334155',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary || '#94a3b8',
    fontSize: FontSize.md || 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 2,
    paddingVertical: Spacing.md || 16,
    borderRadius: BorderRadius.md || 12,
    backgroundColor: Colors.primary || '#3b82f6',
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.5,
  },
  acceptButtonText: {
    color: Colors.text || '#f8fafc',
    fontSize: FontSize.md || 16,
    fontWeight: 'bold',
  },
});
