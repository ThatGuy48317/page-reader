import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/lib/firebase';
import { VoiceSelector } from '@/components/VoiceSelector';
import { TermsOfServiceModal } from '@/components/TermsOfServiceModal';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { DEFAULT_VOICE } from '@/constants/voices';

export default function SettingsScreen() {
  const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_VOICE);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  useEffect(() => {
    const loadVoice = async () => {
      try {
        const stored = await AsyncStorage.getItem('paperecho_default_voice');
        if (stored) {
          setSelectedVoice(stored);
        }
      } catch (e) {
        console.error('Failed to load default voice', e);
      }
    };
    loadVoice();
  }, []);

  const handleSelectVoice = async (voiceId: string) => {
    setSelectedVoice(voiceId);
    try {
      await AsyncStorage.setItem('paperecho_default_voice', voiceId);
    } catch (e) {
      console.error('Failed to save default voice', e);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error('Sign out error', e);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{auth.currentUser?.email || 'Not logged in'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Default Voice</Text>
            <VoiceSelector selectedVoice={selectedVoice} onSelectVoice={handleSelectVoice} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Compliance</Text>
          <TouchableOpacity 
            style={styles.legalCard}
            onPress={() => setShowTermsModal(true)}
          >
            <View style={styles.legalRow}>
              <View style={styles.legalIconContainer}>
                <Text style={styles.legalIcon}>⚖️</Text>
              </View>
              <View style={styles.legalTextContainer}>
                <Text style={styles.legalTitle}>Terms of Service & Fair Use</Text>
                <Text style={styles.legalSubtitle}>Format shifting, 7-day retention & copyright compliance</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>PaperEcho v1.0.0</Text>
        </View>
      </ScrollView>

      <TermsOfServiceModal 
        visible={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  legalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legalIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalIcon: {
    fontSize: 18,
  },
  legalTextContainer: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  legalTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  legalSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  chevron: {
    fontSize: FontSize.xl,
    color: Colors.textTertiary,
    fontWeight: 'bold',
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  signOutButton: {
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  signOutText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  versionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
});
