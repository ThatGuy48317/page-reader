import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface VerifyEmailModalProps {
  visible: boolean;
  userEmail: string;
  onVerified: () => void;
  onSignOut: () => void;
}

export function VerifyEmailModal({ visible, userEmail, onVerified, onSignOut }: VerifyEmailModalProps) {
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          onVerified();
        } else {
          Alert.alert('Not Verified Yet', 'Your email is not verified yet. Please check your inbox and click the verification link.');
        }
      }
    } catch (e) {
      console.error('Error reloading user:', e);
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setSending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setResendSent(true);
      Alert.alert('Verification Link Sent', `A new verification email has been sent to ${userEmail}. Please check your inbox.`);
    } catch (e: any) {
      console.error('Error resending email:', e);
      Alert.alert('Error', e.message || 'Failed to resend verification email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-unread-outline" size={36} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a verification link to <Text style={styles.emailText}>{userEmail}</Text>. Please check your inbox to activate your account.
          </Text>

          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleCheckStatus}
            disabled={checking}
            activeOpacity={0.85}
          >
            {checking ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.primaryButtonText}>I've Verified My Email</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleResend}
            disabled={sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator color={Colors.text} size="small" />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {resendSent ? 'Resend Link Again' : 'Resend Verification Link'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.signOutButton} 
            onPress={onSignOut}
            activeOpacity={0.7}
          >
            <Text style={styles.signOutText}>Sign Out / Use Different Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  emailText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  signOutButton: {
    padding: Spacing.sm,
  },
  signOutText: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
