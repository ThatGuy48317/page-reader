import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
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
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introCard}>
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

            <TouchableOpacity style={styles.agreeButton} onPress={onClose}>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#334155',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    marginTop: 12,
  },
  scrollContent: {
    paddingBottom: 40,
    gap: 16,
  },
  introCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  introText: {
    color: '#93c5fd',
    fontSize: 13,
    lineHeight: 19,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  paragraph: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
  },
  agreeButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  agreeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
