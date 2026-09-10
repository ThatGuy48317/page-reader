import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { Ionicons } from '@expo/vector-icons';
import { db, functions, auth, storage } from '@/lib/firebase';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Book, Chapter } from '@/types/book';
import { VOICES } from '@/constants/voices';
import { DOCUMENT_TYPES } from '@/constants/documentTypes';
import { VoiceSelector } from '@/components/VoiceSelector';
import { RenameModal } from '@/components/RenameModal';
import { BookCover } from '@/components/BookCover';
import { savePlaybackPosition, getPlaybackPosition } from '@/lib/storage';
import { getExpirationInfo } from '@/utils/expiration';

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatRemainingTime = (duration: number, position: number) => {
  if (isNaN(duration) || duration <= 0) return '-0:00';
  const remaining = Math.max(0, duration - position);
  return `-${formatTime(remaining)}`;
};

export default function BookPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [playableUrl, setPlayableUrl] = useState<string | undefined>(undefined);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('auto');
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [hasAutoResumed, setHasAutoResumed] = useState(false);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);

  const handleSaveTitle = async (newTitle: string) => {
    if (!book) return;
    try {
      const docRef = doc(db, 'users', auth.currentUser?.uid || 'anon', 'books', book.id);
      // STRICT INVARIANT: Only update title. Retention timer (expiresAt) and audio URIs remain untouched.
      await updateDoc(docRef, { title: newTitle });
      setBook(prev => prev ? { ...prev, title: newTitle } : null);
    } catch (e) {
      console.error('Failed to rename title:', e);
    } finally {
      setShowRenameModal(false);
    }
  };

  const { 
    isPlaying, position, duration, rate, isLoading,
    play, pause, seekTo, skipForward, skipBack, setRate 
  } = useAudioPlayer(playableUrl);

  const lastSavedRef = useRef<number>(0);

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
                const storageRef = ref(storage, bookData.audioUri);
                const directUrl = await getDownloadURL(storageRef);
                setPlayableUrl(directUrl);
              } catch (storageErr) {
                console.warn('Direct Storage downloadURL failed, using getBookAudio fallback:', storageErr);
                try {
                  const getBookAudioFn = httpsCallable(functions, 'getBookAudio');
                  const result = await getBookAudioFn({ bookId: id });
                  const data = result.data as { success: boolean; audioUrl?: string };
                  if (data.success && data.audioUrl) {
                    setPlayableUrl(data.audioUrl);
                  }
                } catch (fnErr) {
                  console.error('Failed to get audio signed URL fallback:', fnErr);
                }
              } finally {
                setLoadingAudio(false);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error fetching book or audio:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  // Auto-Resume saved playback position once audio is loaded
  useEffect(() => {
    if (!book || !playableUrl || duration <= 0 || hasAutoResumed) return;

    const restorePosition = async () => {
      try {
        const savedPos = await getPlaybackPosition(book.id);
        if (savedPos && savedPos > 5 && savedPos < duration - 5) {
          seekTo(savedPos);
          setResumeMessage(`Resumed from ${formatTime(savedPos)}`);
          setTimeout(() => setResumeMessage(null), 4000);
        }
      } catch (e) {
        console.warn('Failed to restore playback position:', e);
      } finally {
        setHasAutoResumed(true);
      }
    };

    restorePosition();
  }, [book?.id, playableUrl, duration, hasAutoResumed]);

  // Throttled saving of playback position during active listening
  useEffect(() => {
    if (!book || !isPlaying || position <= 0) return;
    const now = Date.now();
    if (now - lastSavedRef.current > 3000) {
      lastSavedRef.current = now;
      savePlaybackPosition(book.id, position).catch(err => {
        console.warn('Auto-save position error:', err);
      });
    }
  }, [book?.id, isPlaying, position]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Opening Audiobook...</Text>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Book not found.</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Return to Library</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const expInfo = getExpirationInfo(book.expiresAt);

  const getCurrentChapter = () => {
    if (!book.chapters || book.chapters.length === 0) return null;
    let current = book.chapters[0];
    for (const chap of book.chapters) {
      if (position >= chap.startTime) {
        current = chap;
      } else {
        break;
      }
    }
    return current;
  };

  const currentChapter = getCurrentChapter();
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
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.headerIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-down" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.nowPlayingPill}>
          <View style={[styles.pulseDot, isPlaying && styles.pulseDotActive]} />
          <Text style={styles.nowPlayingLabel}>
            {expInfo.isExpired ? 'AUDIO EXPIRED' : isPlaying ? 'NOW PLAYING' : 'AUDIOBOOK'}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={() => setShowSettings(true)} 
          style={styles.headerIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Auto-Resume Toast Notification */}
      {resumeMessage && (
        <View style={styles.resumeToast}>
          <Ionicons name="bookmark" size={14} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.resumeToastText}>{resumeMessage}</Text>
        </View>
      )}

      <ScrollView 
        style={styles.scrollArea} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Editorial Book Cover Centerpiece */}
        <View style={styles.coverWrapper}>
          <BookCover 
            title={book.title} 
            voiceName={book.voiceName} 
            coverUrl={book.coverUrl}
            size="hero" 
          />
        </View>

        {/* Title & Metadata Block */}
        <View style={styles.metadataBlock}>
          <TouchableOpacity 
            style={styles.titleClickableRow} 
            onPress={() => setShowRenameModal(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.bookTitle} numberOfLines={2}>
              {book.title || 'Untitled Audiobook'}
            </Text>
            <Ionicons name="pencil" size={14} color={Colors.textTertiary} style={{ marginLeft: 6, marginTop: -4 }} />
          </TouchableOpacity>
          
          <View style={styles.tagRow}>
            {book.voiceName && (
              <View style={styles.narratorTag}>
                <Ionicons 
                  name={book.voiceName === 'auto' ? "people" : "mic-outline"} 
                  size={12} 
                  color={Colors.primary} 
                  style={{ marginRight: 4 }} 
                />
                <Text style={styles.narratorTagText}>
                  {book.voiceName === 'auto' ? 'Ensemble Cast' : book.voiceName}
                </Text>
              </View>
            )}

            {book.detectedType && (
              <View style={styles.styleTag}>
                <Text style={styles.styleTagText}>
                  {DOCUMENT_TYPES.find(d => d.id === book.detectedType)?.name || book.detectedType}
                </Text>
              </View>
            )}

            {/* 7-Day Retention Expiration Badge */}
            <View style={[
              styles.expTag, 
              { backgroundColor: expInfo.badgeBg, borderColor: expInfo.badgeBorder }
            ]}>
              <Ionicons 
                name={expInfo.isExpired ? "alert-circle" : "time-outline"} 
                size={11} 
                color={expInfo.badgeTextColor} 
                style={{ marginRight: 4 }} 
              />
              <Text style={[styles.expTagText, { color: expInfo.badgeTextColor }]}>
                {expInfo.label}
              </Text>
            </View>
          </View>
        </View>

        {expInfo.isExpired ? (
          <View style={styles.expiredCard}>
            <View style={styles.expiredIconWrap}>
              <Ionicons name="time" size={28} color={Colors.error} />
            </View>
            <Text style={styles.expiredTitle}>Audio Retention Expired</Text>
            <Text style={styles.expiredDescription}>
              In accordance with 7-day fair use ephemeral storage, the audio file was purged. You can re-narrate your saved text with any voice for free in seconds.
            </Text>
            <TouchableOpacity 
              style={styles.reNarratePrimaryBtn}
              onPress={() => setShowSettings(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.reNarratePrimaryBtnText}>Re-Narrate with Voice Selection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.playerDeck}>
            {/* Active Chapter Label */}
            <View style={styles.chapterHeaderRow}>
              <Ionicons name="disc-outline" size={14} color={Colors.textTertiary} style={{ marginRight: 6 }} />
              <Text style={styles.chapterTitleText} numberOfLines={1}>
                {currentChapter 
                  ? `Chapter ${(book.chapters?.indexOf(currentChapter) ?? 0) + 1}: ${currentChapter.title}` 
                  : 'Full Audiobook'}
              </Text>
            </View>

            {/* Interactive Progress Bar */}
            <View style={styles.progressContainer}>
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={handleSeekPress}
                style={styles.progressTouchTrack}
              >
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  <View style={[styles.scrubberThumb, { left: `${Math.max(0, Math.min(97, progressPercent))}%` }]} />
                </View>
              </TouchableOpacity>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatRemainingTime(duration, position)}</Text>
              </View>
            </View>

            {/* Audiophile Control Deck */}
            <View style={styles.controlsRow}>
              {/* Skip Back 15s */}
              <TouchableOpacity 
                onPress={() => skipBack(15)} 
                style={styles.skipButton} 
                activeOpacity={0.7}
              >
                <Ionicons name="reload" size={22} color={Colors.textSecondary} style={{ transform: [{ scaleX: -1 }] }} />
                <Text style={styles.skipLabel}>15</Text>
              </TouchableOpacity>

              {/* Center Hero Play / Pause Disc */}
              <TouchableOpacity 
                style={[styles.playButton, isAudioBuffering && styles.playButtonBuffering]} 
                onPress={isPlaying ? pause : play}
                disabled={isAudioBuffering}
                activeOpacity={0.85}
              >
                {isAudioBuffering ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : isPlaying ? (
                  <View style={styles.pauseBarsContainer}>
                    <View style={styles.pauseBar} />
                    <View style={styles.pauseBar} />
                  </View>
                ) : (
                  <Ionicons name="play" size={30} color="#000000" style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>

              {/* Skip Forward 15s */}
              <TouchableOpacity 
                onPress={() => skipForward(15)} 
                style={styles.skipButton} 
                activeOpacity={0.7}
              >
                <Ionicons name="reload" size={22} color={Colors.textSecondary} />
                <Text style={styles.skipLabel}>15</Text>
              </TouchableOpacity>
            </View>

            {/* Playback Speed Pill Bar */}
            <View style={styles.speedBar}>
              {speedOptions.map(r => (
                <TouchableOpacity 
                  key={r} 
                  style={[styles.speedChip, rate === r && styles.speedChipActive]}
                  onPress={() => setRate(r)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.speedChipText, rate === r && styles.speedChipTextActive]}>
                    {r}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Chapters Section */}
        {book.chapters && book.chapters.length > 0 && (
          <View style={styles.chaptersSection}>
            <View style={styles.chaptersSectionHeader}>
              <View style={styles.chaptersTitleGroup}>
                <Ionicons name="list" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.chaptersSectionTitle}>Chapter Index</Text>
              </View>
              <Text style={styles.chaptersCountBadge}>{book.chapters.length} chapters</Text>
            </View>
            
            <View style={styles.chaptersCard}>
              {book.chapters.map((chap, index) => {
                const isCurrent = currentChapter === chap;
                return (
                  <TouchableOpacity 
                    key={String(index)} 
                    style={[
                      styles.chapterRow, 
                      isCurrent && styles.chapterRowActive, 
                      index === (book.chapters?.length || 0) - 1 && { borderBottomWidth: 0 }
                    ]}
                    onPress={() => seekTo(chap.startTime)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.chapterNumberBadge, isCurrent && styles.chapterNumberBadgeActive]}>
                      <Text style={[styles.chapterNumberText, isCurrent && styles.chapterNumberTextActive]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={[styles.chapterRowTitle, isCurrent && styles.chapterRowTitleActive]} numberOfLines={1}>
                      {chap.title}
                    </Text>
                    <Text style={[styles.chapterRowTime, isCurrent && styles.chapterRowTimeActive]}>
                      {formatTime(chap.startTime)}
                    </Text>
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
              <View>
                <Text style={styles.modalTitle}>Studio Re-Narration</Text>
                <Text style={styles.modalSubtitle}>Customize voice persona and reading style</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionLabel}>Narrator Voice</Text>
              <VoiceSelector 
                selectedVoice={selectedVoice} 
                onSelectVoice={setSelectedVoice} 
              />

              <Text style={[styles.modalSectionLabel, { marginTop: 24 }]}>Reading Tone & Style</Text>
              <View style={styles.verticalOptions}>
                {DOCUMENT_TYPES.map(type => (
                  <TouchableOpacity 
                    key={type.id} 
                    style={[styles.styleListItem, selectedStyle === type.id && styles.styleListItemActive]}
                    onPress={() => setSelectedStyle(type.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.styleListEmoji}>{type.emoji}</Text>
                    <View style={styles.styleListText}>
                      <Text style={styles.styleListName}>{type.name}</Text>
                      <Text style={styles.styleListDesc}>{type.description}</Text>
                    </View>
                    {selectedStyle === type.id && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.reNarrateSubmitButton, isReprocessing && styles.reNarrateButtonDisabled]}
                onPress={handleReNarrate}
                disabled={isReprocessing}
                activeOpacity={0.85}
              >
                {isReprocessing ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <View style={styles.buttonRow}>
                    <Ionicons name="sparkles" size={18} color="#000000" style={{ marginRight: 8 }} />
                    <Text style={styles.reNarrateSubmitText}>
                      {selectedVoice ? `Synthesize with ${selectedVoice}` : 'Synthesize Narration'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <RenameModal
        visible={showRenameModal}
        currentTitle={book?.title || ''}
        onSave={handleSaveTitle}
        onCancel={() => setShowRenameModal(false)}
      />
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
    letterSpacing: 0.3,
  },
  errorText: { 
    color: Colors.error, 
    fontSize: FontSize.md, 
    marginBottom: Spacing.md,
  },
  backLink: { 
    padding: Spacing.sm,
  },
  backLinkText: { 
    color: Colors.primary, 
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nowPlayingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textTertiary,
  },
  pulseDotActive: {
    backgroundColor: Colors.success,
  },
  nowPlayingLabel: {
    fontSize: FontSize.xxs,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  resumeToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  resumeToastText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  scrollArea: { 
    flex: 1,
  },
  scrollContent: { 
    paddingHorizontal: Spacing.lg, 
    paddingTop: Spacing.lg, 
    paddingBottom: Spacing.xxxl,
  },
  coverWrapper: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  titleClickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: Spacing.sm,
  },
  metadataBlock: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  bookTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: Spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  narratorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  narratorTagText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  styleTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  styleTagText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  expTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  expTagText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  expiredCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginVertical: Spacing.md,
  },
  expiredIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.errorBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  expiredTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  expiredDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  reNarratePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  reNarratePrimaryBtnText: {
    color: '#000000',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  playerDeck: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  chapterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chapterTitleText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  progressContainer: { 
    marginBottom: Spacing.lg,
  },
  progressTouchTrack: {
    height: 32,
    justifyContent: 'center',
  },
  progressBarBg: { 
    height: 6, 
    backgroundColor: Colors.surfaceHighlight, 
    borderRadius: BorderRadius.full, 
    position: 'relative',
  },
  progressBarFill: { 
    height: '100%', 
    backgroundColor: Colors.primary, 
    borderRadius: BorderRadius.full,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  timeRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 6,
  },
  timeText: { 
    fontSize: FontSize.xs, 
    color: Colors.textTertiary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  controlsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 32,
    marginVertical: Spacing.xs,
  },
  skipButton: { 
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  skipLabel: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: Colors.textSecondary,
    position: 'absolute',
    top: 18,
  },
  playButton: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: Colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonBuffering: { 
    opacity: 0.7,
  },
  pauseBarsContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  pauseBar: {
    width: 5,
    height: 22,
    backgroundColor: '#000000',
    borderRadius: 2.5,
  },
  speedBar: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    padding: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
    gap: 4,
  },
  speedChip: { 
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.full, 
    alignItems: 'center',
  },
  speedChipActive: { 
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  speedChipText: { 
    fontSize: FontSize.xs, 
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  speedChipTextActive: { 
    color: Colors.primary, 
    fontWeight: '700',
  },
  chaptersSection: {
    marginTop: Spacing.sm,
  },
  chaptersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chaptersTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chaptersSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  chaptersCountBadge: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  chaptersCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chapterRowActive: {
    backgroundColor: 'rgba(226, 179, 80, 0.08)',
  },
  chapterNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumberBadgeActive: {
    backgroundColor: Colors.primary,
  },
  chapterNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chapterNumberTextActive: {
    color: '#000000',
  },
  chapterRowTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  chapterRowTitleActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  chapterRowTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginLeft: 8,
    fontVariant: ['tabular-nums'],
  },
  chapterRowTimeActive: {
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingBottom: 40,
  },
  modalSectionLabel: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  verticalOptions: {
    gap: 8,
    marginBottom: Spacing.xl,
  },
  styleListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  styleListItemActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(226, 179, 80, 0.08)',
  },
  styleListEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  styleListText: {
    flex: 1,
  },
  styleListName: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  styleListDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  reNarrateSubmitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  reNarrateButtonDisabled: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reNarrateSubmitText: {
    color: '#000000',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
