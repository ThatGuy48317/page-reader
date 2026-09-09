import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth, storage } from '@/lib/firebase';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Book, Chapter } from '@/types/book';
import { VOICES } from '@/constants/voices';
import { DOCUMENT_TYPES } from '@/constants/documentTypes';

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function BookPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [playableUrl, setPlayableUrl] = useState<string | undefined>(undefined);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('auto');
  const [isReprocessing, setIsReprocessing] = useState(false);

  const { 
    isPlaying, position, duration, rate, isLoading,
    play, pause, seekTo, skipForward, skipBack, setRate 
  } = useAudioPlayer(playableUrl);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'users', auth.currentUser?.uid || 'anon', 'books', id as string);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const bookData = snap.data() as Book;
          setBook({ ...bookData, id: snap.id });
          setSelectedVoice(bookData.voiceName || 'Kore');
          setSelectedStyle(bookData.documentType || 'auto');

          if (bookData.audioUri) {
            if (bookData.audioUri.startsWith('http')) {
              setPlayableUrl(bookData.audioUri);
            } else {
              setLoadingAudio(true);
              try {
                const directUrl = await getDownloadURL(ref(storage, bookData.audioUri));
                console.log('Got direct Firebase Storage download URL');
                setPlayableUrl(directUrl);
              } catch (storageErr) {
                console.log('Direct download URL error, trying getBookAudio callable:', storageErr);
                const getBookAudioFn = httpsCallable<{ audioPath: string }, { url: string }>(functions, 'getBookAudio');
                const res = await getBookAudioFn({ audioPath: bookData.audioUri });
                setPlayableUrl(res.data.url);
              } finally {
                setLoadingAudio(false);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching book or audio:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  if (loading || !book) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your audiobook...</Text>
      </SafeAreaView>
    );
  }

  // Find current chapter based on playback position
  let currentChapter: Chapter | undefined;
  if (book.chapters && book.chapters.length > 0) {
    currentChapter = [...book.chapters].reverse().find(c => position >= c.startTime) || book.chapters[0];
  }

  const speedOptions = [0.75, 1, 1.25, 1.5, 2];

  const handleSeekPress = (e: any) => {
    if (!duration || duration <= 0) return;
    const { locationX } = e.nativeEvent;
    const screenWidth = Dimensions.get('window').width;
    const trackWidth = screenWidth - (Spacing.lg * 2);
    const fraction = Math.max(0, Math.min(1, locationX / trackWidth));
    seekTo(fraction * duration);
  };

  const handleReNarrate = async () => {
    if (isReprocessing) return;
    setIsReprocessing(true);
    try {
      const docRef = doc(db, 'users', auth.currentUser?.uid || 'anon', 'books', book.id);
      await updateDoc(docRef, {
        status: 'extracting',
        progress: 10,
        voiceName: selectedVoice,
        documentType: selectedStyle,
      });

      const processVideoFn = httpsCallable(functions, 'processVideo', { timeout: 600000 });
      processVideoFn({
        bookId: book.id,
        videoPath: book.videoUri,
        voiceName: selectedVoice,
        documentType: selectedStyle,
      }).catch((err) => {
        console.error('Background processVideo error:', err);
      });

      setShowSettings(false);
      router.push(`/processing/${book.id}`);
    } catch (e) {
      console.error('Re-narration failed', e);
    } finally {
      setIsReprocessing(false);
    }
  };

  const progressPercent = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  const isAudioBuffering = isLoading || loadingAudio;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>← Library</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{book.title}</Text>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.headerBtn}>
          <Text style={styles.headerSettingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollArea} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Album Art / Book Card */}
        <View style={styles.cardCover}>
          <Text style={styles.coverEmoji}>📖</Text>
          <Text style={styles.coverBookTitle} numberOfLines={2}>{book.title}</Text>
          {book.detectedType && (
            <View style={styles.styleBadge}>
              <Text style={styles.styleBadgeText}>
                {DOCUMENT_TYPES.find(d => d.id === book.detectedType)?.name || book.detectedType}
              </Text>
            </View>
          )}
        </View>

        {book.status === 'expired' ? (
          <View style={styles.expiredContainer}>
            <Text style={styles.expiredTitle}>⏰ Audio Retention Expired</Text>
            <Text style={styles.expiredDescription}>
              Audio files are kept for 7 days to preserve storage. You can re-narrate your book anytime for free!
            </Text>
            <TouchableOpacity 
              style={styles.reNarrateButtonInline}
              onPress={() => setShowSettings(true)}
            >
              <Text style={styles.reNarrateButtonTextInline}>Re-narrate Book 🔁</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.playerWrapper}>
            {/* Active Chapter Label */}
            <Text style={styles.chapterSubtitle} numberOfLines={1}>
              {currentChapter 
                ? `Chapter ${(book.chapters?.indexOf(currentChapter) ?? 0) + 1}: ${currentChapter.title}` 
                : 'Full Audiobook'}
            </Text>

            {/* Interactive Progress Bar */}
            <View style={styles.progressContainer}>
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={handleSeekPress}
                style={styles.progressTouchTrack}
              >
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
              </TouchableOpacity>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            {/* Main Playback Controls */}
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={() => skipBack(15)} style={styles.skipButton} activeOpacity={0.7}>
                <Text style={styles.skipIcon}>↺</Text>
                <Text style={styles.skipLabel}>15s</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.playButton, isAudioBuffering && styles.playButtonBuffering]} 
                onPress={isPlaying ? pause : play}
                disabled={isAudioBuffering}
                activeOpacity={0.8}
              >
                {isAudioBuffering ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : isPlaying ? (
                  <View style={styles.pauseBarsContainer}>
                    <View style={styles.pauseBar} />
                    <View style={styles.pauseBar} />
                  </View>
                ) : (
                  <Text style={styles.playIcon}>▶</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => skipForward(15)} style={styles.skipButton} activeOpacity={0.7}>
                <Text style={styles.skipIcon}>↻</Text>
                <Text style={styles.skipLabel}>15s</Text>
              </TouchableOpacity>
            </View>

            {/* Playback Speed Chips */}
            <View style={styles.speedSection}>
              <Text style={styles.speedLabel}>Speed:</Text>
              <View style={styles.speedRow}>
                {speedOptions.map(r => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.speedChip, rate === r && styles.speedChipActive]}
                    onPress={() => setRate(r)}
                  >
                    <Text style={[styles.speedChipText, rate === r && styles.speedChipTextActive]}>{r}x</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Chapters Section */}
        {book.chapters && book.chapters.length > 0 && (
          <View style={styles.chaptersSection}>
            <View style={styles.chaptersSectionHeader}>
              <Text style={styles.chaptersSectionTitle}>Chapters</Text>
              <Text style={styles.chaptersCountText}>{book.chapters.length} tracks</Text>
            </View>
            
            <View style={styles.chaptersCard}>
              {book.chapters.map((chap, index) => {
                const isCurrent = currentChapter === chap;
                return (
                  <TouchableOpacity 
                    key={String(index)} 
                    style={[styles.chapterRow, isCurrent && styles.chapterRowActive, index === (book.chapters?.length || 0) - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => seekTo(chap.startTime)}
                  >
                    <View style={styles.chapterNumberBadge}>
                      <Text style={[styles.chapterNumberText, isCurrent && styles.chapterNumberTextActive]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={[styles.chapterRowTitle, isCurrent && styles.chapterRowTitleActive]} numberOfLines={1}>
                      {chap.title}
                    </Text>
                    <Text style={styles.chapterRowTime}>{formatTime(chap.startTime)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Re-narration Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Narration Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.closeBtn}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionLabel}>Voice</Text>
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

              <Text style={styles.modalSectionLabel}>Reading Style</Text>
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
  container: { 
    flex: 1, 
    backgroundColor: '#0f172a' 
  },
  centerContainer: { 
    flex: 1, 
    backgroundColor: '#0f172a', 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerBtn: { 
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  headerBtnText: { 
    color: '#3b82f6', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  headerSettingsIcon: { 
    fontSize: 18 
  },
  headerTitle: { 
    flex: 1, 
    color: '#f8fafc', 
    fontSize: 16, 
    fontWeight: 'bold', 
    textAlign: 'center',
    marginHorizontal: 10,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  cardCover: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  coverEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  coverBookTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  styleBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  styleBadgeText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
  playerWrapper: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  chapterSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTouchTrack: {
    paddingVertical: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 20,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#334155',
  },
  skipIcon: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonBuffering: {
    backgroundColor: '#2563eb',
  },
  playIcon: {
    color: '#ffffff',
    fontSize: 30,
    marginLeft: 3,
  },
  pauseBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  pauseBar: {
    width: 6,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  speedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  speedLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  speedRow: {
    flexDirection: 'row',
    gap: 6,
  },
  speedChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  speedChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  speedChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  speedChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  chaptersSection: {
    marginBottom: 20,
  },
  chaptersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  chaptersSectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  chaptersCountText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  chaptersCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  chapterRowActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  chapterNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumberText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  chapterNumberTextActive: {
    color: '#60a5fa',
  },
  chapterRowTitle: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  chapterRowTitleActive: {
    color: '#60a5fa',
    fontWeight: '700',
  },
  chapterRowTime: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  expiredContainer: {
    padding: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
    marginBottom: 20,
  },
  expiredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 8,
  },
  expiredDescription: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  reNarrateButtonInline: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  reNarrateButtonTextInline: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '75%',
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 4,
  },
  closeModalText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  modalContent: {
    paddingBottom: 32,
  },
  modalSectionLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
  },
  scrollOptions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionChipText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  optionChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  verticalOptions: {
    gap: 8,
    marginBottom: 20,
  },
  styleListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  styleListItemActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  styleListEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  styleListText: {
    flex: 1,
  },
  styleListName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  styleListDesc: {
    color: '#94a3b8',
    fontSize: 11,
  },
  reNarrateButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  reNarrateButtonDisabled: {
    opacity: 0.5,
  },
  reNarrateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
