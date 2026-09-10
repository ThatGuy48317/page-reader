import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '@/lib/firebase';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Book, ProcessingStep } from '@/types/book';
import { BookCover } from '@/components/BookCover';

const STEPS: { key: ProcessingStep; label: string; desc: string }[] = [
  { 
    key: 'uploading', 
    label: 'Uploading Recording', 
    desc: 'Transferring video to secure cloud workspace' 
  },
  { 
    key: 'extracting', 
    label: 'Transcribing Pages', 
    desc: 'OCR page detection, hyphen fixing & chapter extraction' 
  },
  { 
    key: 'generating_audio', 
    label: 'Synthesizing Narration', 
    desc: 'Generating humanlike neural speech audio' 
  },
  { 
    key: 'ready', 
    label: 'Audiobook Ready', 
    desc: 'Chapters prepared and ready for playback' 
  },
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading studio status...</Text>
      </SafeAreaView>
    );
  }

  const currentStepIndex = STEPS.findIndex(s => s.key === book.status) || 0;
  const displayStepIndex = book.status === 'error' ? -1 : currentStepIndex;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)')} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.backButtonText}>Library</Text>
        </TouchableOpacity>
        <Text style={styles.headerPill}>STUDIO WORKFLOW</Text>
      </View>

      <View style={styles.content}>
        {/* Cover Art Centerpiece */}
        <View style={styles.coverWrapper}>
          <BookCover 
            title={book.title} 
            voiceName={book.voiceName} 
            coverUrl={book.coverUrl}
            size="medium" 
          />
        </View>

        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.subtitle}>Transforming physical pages into an audiobook</Text>

        <View style={styles.stepsCard}>
          {STEPS.map((step, index) => {
            const isCompleted = index < displayStepIndex || book.status === 'ready';
            const isActive = index === displayStepIndex;
            
            return (
              <View 
                key={step.key} 
                style={[
                  styles.stepRow,
                  index === STEPS.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={[
                  styles.stepIconContainer,
                  isCompleted && styles.stepIconCompleted,
                  isActive && styles.stepIconActive,
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={16} color="#000000" />
                  ) : isActive ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <View style={styles.stepIconDot} />
                  )}
                </View>

                <View style={styles.stepTextGroup}>
                  <Text style={[
                    styles.stepLabel,
                    (isCompleted || isActive) && styles.stepLabelActive
                  ]}>
                    {step.label}
                  </Text>
                  <Text style={styles.stepDesc}>
                    {step.key === 'generating_audio' && book.voiceName
                      ? `Synthesizing neural voice with ${book.voiceName}`
                      : step.desc}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {book.status === 'error' && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color={Colors.error} style={{ marginBottom: 6 }} />
            <Text style={styles.errorText}>An error occurred while processing.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.push('/(tabs)/scan')}>
              <Text style={styles.retryButtonText}>Return to Scan</Text>
            </TouchableOpacity>
          </View>
        )}

        {book.status === 'ready' && (
          <TouchableOpacity 
            style={styles.listenButton} 
            onPress={() => router.replace(`/book/${book.id}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={20} color="#000000" style={{ marginRight: 8 }} />
            <Text style={styles.listenButtonText}>Listen to Audiobook</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  backButtonText: { 
    color: Colors.textSecondary, 
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  headerPill: {
    fontSize: FontSize.xxs,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  content: { 
    flex: 1, 
    padding: Spacing.xl, 
    justifyContent: 'center',
  },
  coverWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: { 
    fontSize: FontSize.xl, 
    fontWeight: '800', 
    color: Colors.text, 
    marginBottom: 4, 
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: { 
    fontSize: FontSize.xs, 
    color: Colors.textSecondary, 
    marginBottom: Spacing.xl, 
    textAlign: 'center',
  },
  stepsCard: { 
    backgroundColor: Colors.surface, 
    borderRadius: BorderRadius.xl, 
    padding: Spacing.md, 
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepIconContainer: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: Colors.surfaceElevated, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepIconActive: { 
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepIconCompleted: { 
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepIconDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: Colors.textTertiary,
  },
  stepTextGroup: {
    flex: 1,
  },
  stepLabel: { 
    fontSize: FontSize.sm, 
    color: Colors.textTertiary,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepLabelActive: { 
    color: Colors.text, 
    fontWeight: '700',
  },
  stepDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  errorContainer: { 
    alignItems: 'center', 
    padding: Spacing.md,
  },
  errorText: { 
    color: Colors.error, 
    fontSize: FontSize.sm, 
    marginBottom: Spacing.md,
  },
  retryButton: { 
    backgroundColor: Colors.surfaceElevated, 
    paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.md, 
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryButtonText: { 
    color: Colors.text, 
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  listenButton: { 
    flexDirection: 'row',
    backgroundColor: Colors.primary, 
    padding: Spacing.lg, 
    borderRadius: BorderRadius.md, 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  listenButtonText: { 
    color: '#000000', 
    fontSize: FontSize.md, 
    fontWeight: '700',
  },
});
