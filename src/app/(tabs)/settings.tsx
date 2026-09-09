import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Preferences & Compliance</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.label}>Authenticated User</Text>
              <Text style={styles.value}>{auth.currentUser?.email || 'Anonymous Session'}</Text>
            </View>
          </View>
        </View>

        {/* Narrator Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Narrator</Text>
          <View style={styles.cardSection}>
            <VoiceSelector selectedVoice={selectedVoice} onSelectVoice={handleSelectVoice} />
          </View>
        </View>

        {/* Legal & Compliance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Fair Use</Text>
          <TouchableOpacity 
            style={styles.legalCard}
            onPress={() => setShowTermsModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.legalRow}>
              <View style={styles.legalIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.legalTextContainer}>
                <Text style={styles.legalTitle}>Terms of Service & Fair Use Policy</Text>
                <Text style={styles.legalSubtitle}>Personal format shifting, 7-day storage purge & IP warranties</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>PaperEcho • Version 1.0.0 (Production)</Text>
          <Text style={styles.subVersionText}>Powered by Google Gemini 3.6 Flash & Neural TTS</Text>
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
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xxs,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountInfo: {
    flex: 1,
  },
  label: {
    fontSize: FontSize.xxs,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  legalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legalIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legalTextContainer: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  legalTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  legalSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  signOutText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: 4,
  },
  versionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  subVersionText: {
    color: Colors.textTertiary,
    fontSize: FontSize.xxs,
  },
});
