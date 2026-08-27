import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Book, Chapter } from '@/types/book';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function BookPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const { 
    isPlaying, position, duration, rate, isLoading,
    play, pause, seekTo, skipForward, skipBack, setRate 
  } = useAudioPlayer(book?.audioUri);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;
      const docRef = doc(db, 'books', id as string);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setBook({ id: snap.id, ...snap.data() } as Book);
      }
      setLoading(false);
    };
    fetchBook();
  }, [id]);

  if (loading || !book) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  // Find current chapter
  let currentChapter: Chapter | undefined;
  if (book.chapters && book.chapters.length > 0) {
    currentChapter = [...book.chapters].reverse().find(c => position >= c.startTime) || book.chapters[0];
  }

  const speedOptions = [0.75, 1, 1.25, 1.5, 2];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{book.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.illustrationContainer}>
        <Text style={styles.illustrationIcon}>📖</Text>
      </View>

      <View style={styles.playerSection}>
        <Text style={styles.chapterText}>
          {currentChapter ? `Chapter ${book.chapters?.indexOf(currentChapter) ?? 0 + 1}: ${currentChapter.title}` : 'Full Audiobook'}
        </Text>

        <View style={styles.progressContainer}>
          {/* Simple slider representation (use expo-slider or slider component in real app) */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={() => skipBack()} style={styles.skipButton}>
            <Text style={styles.skipText}>↺ 15s</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.playButton} 
            onPress={isPlaying ? pause : play}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => skipForward()} style={styles.skipButton}>
            <Text style={styles.skipText}>15s ↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.speedRow}>
          {speedOptions.map(r => (
            <TouchableOpacity 
              key={r} 
              style={[styles.speedButton, rate === r && styles.speedButtonActive]}
              onPress={() => setRate(r)}
            >
              <Text style={[styles.speedText, rate === r && styles.speedTextActive]}>{r}x</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {book.chapters && (
        <ScrollView style={styles.chaptersList} contentContainerStyle={{ padding: Spacing.md }}>
          <Text style={styles.chaptersHeader}>Chapters</Text>
          {book.chapters.map((chap, index) => (
            <TouchableOpacity 
              key={String(index)} 
              style={[styles.chapterItem, currentChapter === chap && styles.chapterItemActive]}
              onPress={() => seekTo(chap.startTime)}
            >
              <Text style={[styles.chapterItemTitle, currentChapter === chap && styles.chapterItemTitleActive]}>
                {index + 1}. {chap.title}
              </Text>
              <Text style={styles.chapterItemTime}>{formatTime(chap.startTime)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, justifyContent: 'space-between' },
  backButton: { padding: Spacing.sm, width: 40, alignItems: 'center' },
  backButtonText: { color: Colors.primary, fontSize: FontSize.xl, fontWeight: 'bold' },
  headerTitle: { flex: 1, color: Colors.text, fontSize: FontSize.lg, fontWeight: 'bold', textAlign: 'center' },
  
  illustrationContainer: { margin: Spacing.xl, height: 240, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  illustrationIcon: { fontSize: 96 },
  
  playerSection: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  chapterText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600', textAlign: 'center', marginBottom: Spacing.lg },
  
  progressContainer: { marginBottom: Spacing.xl },
  progressBarBg: { height: 6, backgroundColor: Colors.surfaceLight, borderRadius: 3, marginBottom: Spacing.sm },
  progressBarFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', marginBottom: Spacing.xl },
  skipButton: { padding: Spacing.md },
  skipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: 'bold' },
  playButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  playIcon: { color: Colors.text, fontSize: 32, marginLeft: 4 }, // slight offset for play icon optical center
  
  speedRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  speedButton: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 16, backgroundColor: Colors.surface },
  speedButtonActive: { backgroundColor: Colors.primary },
  speedText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  speedTextActive: { color: Colors.text },

  chaptersList: { flex: 1, backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, marginTop: Spacing.md },
  chaptersHeader: { color: Colors.text, fontSize: FontSize.lg, fontWeight: 'bold', marginBottom: Spacing.md, paddingHorizontal: Spacing.xs },
  chapterItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.surfaceLight },
  chapterItemActive: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  chapterItemTitle: { color: Colors.text, fontSize: FontSize.md, flex: 1 },
  chapterItemTitleActive: { color: Colors.primary, fontWeight: 'bold' },
  chapterItemTime: { color: Colors.textSecondary, fontSize: FontSize.md },
});
