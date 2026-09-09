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
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/lib/firebase';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { GoogleLogo } from '@/components/GoogleLogo';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToToS, setAgreeToToS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '1099382222092-placeholder.apps.googleusercontent.com';
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '1099382222092-placeholder.apps.googleusercontent.com';
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '1099382222092-placeholder.apps.googleusercontent.com';

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    webClientId,
    androidClientId,
    iosClientId,
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
        if (!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID && Platform.OS === 'android') {
          setError('Google Sign-In on Android requires an OAuth Client ID in .env. For quick testing, use Email/Password sign-in.');
          setLoading(false);
          return;
        }
        if (promptAsync) {
          await promptAsync();
        } else {
          setError('Google Sign-In is initializing...');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google sign-in failed');
    } finally {
      if (Platform.OS === 'web') {
        setLoading(false);
      }
    }
  };

  const handleAuth = async () => {
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
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="book-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>PaperEcho</Text>
          <Text style={styles.appSubtitle}>Turn physical books into AI-narrated audiobooks</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isLogin ? 'Welcome Back' : 'Create an Account'}</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Google Sign-In */}
          <TouchableOpacity 
            style={[styles.googleButton, (!request || loading) && styles.googleButtonDisabled]} 
            onPress={handleGoogleSignIn}
            disabled={!request || loading}
            activeOpacity={0.85}
          >
            <View style={styles.googleIconContainer}>
              <GoogleLogo size={18} />
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.textTertiary}
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
                placeholder="••••••••"
                placeholderTextColor={Colors.textTertiary}
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
                <View style={[styles.checkboxBox, agreeToToS && styles.checkboxBoxChecked]}>
                  {agreeToToS && <Ionicons name="checkmark" size={12} color="#000000" />}
                </View>
                <Text style={styles.tosLabel}>
                  I certify that I own a lawful copy of any book I scan for personal, non-commercial format shifting under 17 U.S.C. § 107.
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity 
            style={styles.authButton} 
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.authButtonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
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
          activeOpacity={0.7}
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
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
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
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#1f2937',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.xxs,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  label: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    color: Colors.text,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: FontSize.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  tosRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tosRowChecked: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(226, 179, 80, 0.06)',
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tosLabel: {
    flex: 1,
    fontSize: FontSize.xxs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  authButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  authButtonText: {
    color: '#000000',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  toggleText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
