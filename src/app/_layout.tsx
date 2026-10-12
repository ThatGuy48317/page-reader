import 'expo-blob';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { VerifyEmailModal } from '@/components/VerifyEmailModal';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setAuthLoaded(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authLoaded) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      router.replace('/auth');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, authLoaded, segments]);

  if (!authLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary || '#3b82f6'} />
      </View>
    );
  }

  const isPasswordUserUnverified = Boolean(
    user && 
    !user.emailVerified && 
    user.providerData.some(p => p.providerId === 'password')
  );

  return (
    <AccessibilityProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f172a' } }}>
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="book/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="processing/[id]" />
        </Stack>

        <VerifyEmailModal 
          visible={isPasswordUserUnverified}
          userEmail={user?.email || ''}
          onVerified={() => {
            if (auth.currentUser) {
              setUser({ ...auth.currentUser });
            }
          }}
          onSignOut={async () => {
            await auth.signOut();
          }}
        />
      </SafeAreaProvider>
    </AccessibilityProvider>
  );
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Application Error</Text>
      <Text style={styles.errorMessage}>{error.message || 'An unexpected error occurred.'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={retry} activeOpacity={0.8}>
        <Text style={styles.retryButtonText}>Restart View</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#e2b350',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});

