import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Book, Chapter } from '@/types/book';
import { VOICES } from '@/constants/voices';
import { DOCUMENT_TYPES } from '@/constants/documentTypes';

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
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('auto');
  const [isReprocessing, setIsReprocessing] = useState(false);

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
        const bookData = snap.data() as Book;
        setBook({ ...bookData, id: snap.id });
        setSelectedVoice(bookData.voiceName || 'Kore');
        setSelectedStyle(bookData.documentType || 'auto');
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

  const handleReNarrate = async () => {
    if (isReprocessing) return;
    setIsReprocessing(true);
    try {
      const docRef = doc(db, 'books', book.id);
      await updateDoc(docRef, {
        status: 'extracting',
        progress: 10,
        voiceName: selectedVoice,
        documentType: selectedStyle,
      });

      const processVideoFn = httpsCallable(functions, 'processVideo');
      processVideoFn({
        bookId: book.id,
        videoPath: book.videoUri,
        voiceName: selectedVoice,
        documentType: selectedStyle,
      }).catch(console.error);

      setShowSettings(false);
      router.push(`/processing/${book.id}`);
    } catch (e) {
      console.error('Re-narration failed', e);
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{book.title}</Text>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
          <Text style={styles.settingsButtonIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.illustrationContainer}>
        <Text style={styles.illustrationIcon}>📖</Text>
        {book.detectedType && (
          <Text style={styles.detectedStyleTag}>
            Style: {DOCUMENT_TYPES.find(d => d.id === book.detectedType)?.name || book.detectedType}
          </Text>
        )}
      </View>

      {book.status === 'expired' ? (
        <View style={styles.expiredContainer}>
          <Text style={styles.expiredTitle}>⏰ Audio Expired</Text>
          <Text style={styles.expiredDescription}>
            The generated audio for this book has expired to save cloud storage space. You can re-narrate it for free to generate a fresh audio track.
          </Text>
          <TouchableOpacity 
            style={styles.reNarrateButtonInline}
            onPress={() => setShowSettings(true)}
          >
            <Text style={styles.reNarrateButtonTextInline}>Configure & Re-narrate 🔁</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.playerSection}>
          <Text style={styles.chapterText}>
            {currentChapter ? `Chapter ${(book.chapters?.indexOf(currentChapter) ?? 0) + 1}: ${currentChapter.title}` : 'Full Audiobook'}
          </Text>

          <View style={styles.progressContainer}>
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
      )}

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

      {/* Re-narration Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audiobook Narration Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalSectionLabel}>Select Voice</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollOptions}>
                {VOICES.map(v => (
                  <TouchableOpacity 
                    key={v.id} 
                    style={[styles.optionChip, selectedVoice === v.id && styles.optionChipActive]}
                    onPress={() => setSelectedVoice(v.id)}
                  >
                    <Text style={[styles.optionChipText, selectedVoice === v.id && styles.optionChipTextActive]}>
                      {v.gender === 'male' ? '👨' : '👩'} {v.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.modalSectionLabel}>Select Reading Style</Text>
              <View style={styles.verticalOptions}>
                {DOCUMENT_TYPES.map(type => (
                  <TouchableOpacity 
                    key={type.id} 
                    style={[styles.styleListItem, selectedStyle === type.id && styles.styleListItemActive]}
                    onPress={() => setSelectedStyle(type.id)}
                  >
                    <Text style={styles.styleListEmoji}>{type.emoji}</Text>
                    <View style={styles.styleListText}>
                      <Text style={styles.styleListName}>{type.name}</Text>
                      <Text style={styles.styleListDesc}>{type.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.reNarrateButton, isReprocessing && styles.reNarrateButtonDisabled]}
                onPress={handleReNarrate}
                disabled={isReprocessing}
              >
                {isReprocessing ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <Text style={styles.reNarrateButtonText}>Re-Narrate Audiobook 🔁</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, justifyContent: 'space-between' },
  backButton: { padding: Spacing.sm, width: 40, alignItems: 'center' },
  backButtonText: { color: Colors.primary, fontSize: FontSize.xl, fontWeight: 'bold' },
  settingsButton: { padding: Spacing.sm, width: 40, alignItems: 'center' },
  settingsButtonIcon: { fontSize: FontSize.xl },
  headerTitle: { flex: 1, color: Colors.text, fontSize: FontSize.lg, fontWeight: 'bold', textAlign: 'center' },
  
  illustrationContainer: { margin: Spacing.xl, height: 200, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  illustrationIcon: { fontSize: 80 },
  detectedStyleTag: { position: 'absolute', bottom: Spacing.md, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 12, color: Colors.primary, fontSize: FontSize.xs, fontWeight: '600' },
  
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
  playIcon: { color: Colors.text, fontSize: 32, marginLeft: 4 },
  
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

  // Modal styling
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContainer: { height: '80%', backgroundColor: Colors.background, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: 'bold', color: Colors.text },
  closeModalText: { fontSize: 20, color: Colors.textSecondary, fontWeight: 'bold' },
  modalContent: { paddingBottom: Spacing.xxl },
  modalSectionLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: 'bold', textTransform: 'uppercase', marginTop: Spacing.md, marginBottom: Spacing.sm },
  scrollOptions: { flexDirection: 'row', marginBottom: Spacing.md },
  optionChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, backgroundColor: Colors.surface, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceLight },
  optionChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionChipText: { color: Colors.textSecondary },
  optionChipTextActive: { color: Colors.text, fontWeight: 'bold' },

  verticalOptions: { gap: Spacing.sm, marginBottom: Spacing.lg },
  styleListItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'transparent' },
  styleListItemActive: { borderColor: Colors.primary },
  styleListEmoji: { fontSize: 24, marginRight: Spacing.md },
  styleListText: { flex: 1 },
  styleListName: { color: Colors.text, fontSize: FontSize.md, fontWeight: 'bold', marginBottom: 2 },
  styleListDesc: { color: Colors.textSecondary, fontSize: FontSize.xs },

  reNarrateButton: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.md },
  reNarrateButtonDisabled: { opacity: 0.5 },
  reNarrateButtonText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: 'bold' },

  // Expired player styling
  expiredContainer: { padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, marginHorizontal: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  expiredTitle: { fontSize: FontSize.lg, fontWeight: 'bold', color: Colors.error, marginBottom: Spacing.sm },
  expiredDescription: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.md },
  reNarrateButtonInline: { backgroundColor: Colors.primary, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center' },
  reNarrateButtonTextInline: { color: Colors.text, fontSize: FontSize.md, fontWeight: 'bold' },
});
