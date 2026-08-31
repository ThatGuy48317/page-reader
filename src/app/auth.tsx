import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithCredential 
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth } from '@/lib/firebase';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToToS, setAgreeToToS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        setLoading(true);
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .catch((err) => {
            console.error(err);
            setError(err.message || 'Google authentication failed.');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    setError('');
    if (!isLogin && !agreeToToS) {
      setError('You must agree to the Terms of Service to sign up.');
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        if (promptAsync) {
          await promptAsync();
        } else {
          setError('Google Sign-In is initializing...');
        }
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/popup-closed-by-user') {
        // User closed popup, no error needed
      } else {
        setError(e.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

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
      if (e.code === 'auth/email-already-in-use') {
        setError('That email address is already in use.');
      } else if (e.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (e.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
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

          {/* Google Sign-in Button */}
          <TouchableOpacity 
            style={[styles.googleButton, (!isLogin && !agreeToToS) && styles.googleButtonDisabled]} 
            onPress={handleGoogleSignIn}
            disabled={loading || (!isLogin && !agreeToToS)}
          >
            <View style={styles.googleIconContainer}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>
              {isLogin ? 'Continue with Google' : 'Sign up with Google'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

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
              <Text style={styles.authButtonText}>{isLogin ? 'Sign In with Email' : 'Sign Up with Email'}</Text>
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
    marginBottom: Spacing.xl,
  },
  logo: {
    fontSize: 56,
    marginBottom: Spacing.xs,
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
    marginBottom: Spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  googleIconText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  googleButtonText: {
    color: '#1f2937',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceLight,
  },
  dividerText: {
    color: Colors.textTertiary || '#64748b',
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
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
    marginTop: Spacing.md,
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
    marginTop: Spacing.lg,
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
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  toggleText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
