import 'expo-blob';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
