import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToToS, setAgreeToToS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!agreeToToS) {
        setError('You must agree to the Terms of Service to sign up.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      console.error(e);
      // Friendly messages for Firebase errors
      if (e.code === 'auth/email-already-in-use') {
        setError('That email address is already in use.');
      } else if (e.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (e.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else {
        setError(e.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>📖</Text>
          <Text style={styles.appName}>PageReader</Text>
          <Text style={styles.appSubtitle}>Turn your books into personal audiobooks</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor={Colors.textTertiary || '#64748b'}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min 6 characters"
            placeholderTextColor={Colors.textTertiary || '#64748b'}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          {!isLogin && (
            <>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Repeat password"
                placeholderTextColor={Colors.textTertiary || '#64748b'}
                secureTextEntry
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />

              <TouchableOpacity 
                style={[styles.tosRow, agreeToToS && styles.tosRowChecked]} 
                onPress={() => setAgreeToToS(!agreeToToS)}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.checkboxIcon}>{agreeToToS ? '☑️' : '⬛'}</Text>
                <Text style={styles.tosLabel}>
                  I agree to the <Text style={styles.tosLink}>Terms of Service</Text> and certify that any book I scan is a legally acquired physical book or library book for personal, non-commercial use only.
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity 
            style={[styles.authButton, (!isLogin && !agreeToToS) && styles.authButtonDisabled]} 
            onPress={handleAuth}
            disabled={loading || (!isLogin && !agreeToToS)}
          >
            {loading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <Text style={styles.authButtonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          disabled={loading}
        >
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 1.5,
  },
  logo: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.background,
    color: Colors.text,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
    fontSize: FontSize.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  tosRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.lg,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tosRowChecked: {
    borderColor: Colors.primary,
  },
  checkboxIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  tosLabel: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  tosLink: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  authButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  authButtonDisabled: {
    opacity: 0.5,
  },
  authButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.md,
  },
  toggleText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
