import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Book, ProcessingStep } from '@/types/book';

const STEPS: { key: ProcessingStep; label: string }[] = [
  { key: 'uploading', label: 'Uploading Video' },
  { key: 'extracting', label: 'Extracting Text' },
  { key: 'generating_audio', label: 'Generating Audio' },
  { key: 'ready', label: 'Ready' },
];

export default function ProcessingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser?.uid || 'anon', 'books', id as string), (snapshot) => {
      if (snapshot.exists()) {
        setBook({ id: snapshot.id, ...snapshot.data() } as Book);
      }
    });
    return () => unsubscribe();
  }, [id]);

  if (!book) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const currentStepIndex = STEPS.findIndex(s => s.key === book.status) || 0;
  
  // Handle edge cases where status might not match standard flow
  const displayStepIndex = book.status === 'error' ? -1 : currentStepIndex;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Library</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.subtitle}>Processing your book...</Text>

        <View style={styles.stepsContainer}>
          {STEPS.map((step, index) => {
            const isCompleted = index < displayStepIndex || book.status === 'ready';
            const isActive = index === displayStepIndex;
            
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={[
                  styles.stepIconContainer,
                  isCompleted && styles.stepIconContainerCompleted,
                  isActive && styles.stepIconContainerActive
                ]}>
                  {isCompleted ? (
                    <Text style={styles.stepIconText}>✓</Text>
                  ) : isActive ? (
                    <ActivityIndicator size="small" color={Colors.text} />
                  ) : (
                    <View style={styles.stepIconDot} />
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  (isCompleted || isActive) && styles.stepLabelActive
                ]}>{step.label}</Text>
              </View>
            );
          })}
        </View>

        {book.status === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>An error occurred while processing.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => {/* Handle Retry logic */}}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {book.status === 'ready' && (
          <TouchableOpacity 
            style={styles.listenButton} 
            onPress={() => router.replace(`/book/${book.id}`)}
          >
            <Text style={styles.listenButtonText}>🎧 Listen Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.md },
  backButton: { padding: Spacing.sm },
  backButtonText: { color: Colors.primary, fontSize: FontSize.md },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.xs, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xxl, textAlign: 'center' },
  stepsContainer: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.xxl },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  stepIconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceLight, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  stepIconContainerActive: { backgroundColor: Colors.primary },
  stepIconContainerCompleted: { backgroundColor: Colors.success },
  stepIconDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textSecondary },
  stepIconText: { color: Colors.text, fontWeight: 'bold' },
  stepLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
  stepLabelActive: { color: Colors.text, fontWeight: '600' },
  errorContainer: { alignItems: 'center', padding: Spacing.md },
  errorText: { color: Colors.error, fontSize: FontSize.md, marginBottom: Spacing.md },
  retryButton: { backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.sm },
  retryButtonText: { color: Colors.text, fontWeight: 'bold' },
  listenButton: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center' },
  listenButtonText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: 'bold' },
});
