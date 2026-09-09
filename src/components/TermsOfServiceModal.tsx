import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { TERMS_SECTIONS, TERMS_OF_SERVICE_VERSION, TERMS_OF_SERVICE_LAST_UPDATED } from '@/constants/termsOfService';

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TermsOfServiceModal({ visible, onClose }: TermsOfServiceModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Terms of Service & Fair Use</Text>
              <Text style={styles.subtitle}>v{TERMS_OF_SERVICE_VERSION} • Updated {TERMS_OF_SERVICE_LAST_UPDATED}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introCard}>
              <View style={styles.introHeader}>
                <Ionicons name="shield-checkmark" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.introHeading}>Compliance Notice</Text>
              </View>
              <Text style={styles.introText}>
                PaperEcho is built strictly for <Text style={styles.boldText}>personal, non-commercial format shifting</Text> of physical books you legally own. Please review our Fair Use compliance principles and terms below.
              </Text>
            </View>

            {TERMS_SECTIONS.map((section, index) => (
              <View key={index} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>{section.icon}</Text>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                {section.content.map((p, pIndex) => (
                  <Text key={pIndex} style={styles.paragraph}>{p}</Text>
                ))}
              </View>
            ))}

            <TouchableOpacity style={styles.agreeButton} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={18} color="#000000" style={{ marginRight: 6 }} />
              <Text style={styles.agreeButtonText}>I Understand & Agree</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    borderColor: Colors.borderLight,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    marginTop: Spacing.sm,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  introCard: {
    backgroundColor: 'rgba(226, 179, 80, 0.08)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 179, 80, 0.25)',
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  introHeading: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  introText: {
    color: '#fef3c7',
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    flex: 1,
  },
  paragraph: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  agreeButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  agreeButtonText: {
    color: '#000000',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
