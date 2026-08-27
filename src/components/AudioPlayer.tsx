import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Chapter } from '@/types/book';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface AudioPlayerProps {
  audioUri: string;
  chapters: Chapter[];
  bookTitle: string;
}

export function AudioPlayer({ audioUri, chapters, bookTitle }: AudioPlayerProps) {
  const {
    isPlaying,
    position,
    duration,
    rate,
    isLoading,
    play,
    pause,
    seekTo,
    skipForward,
    skipBack,
    setRate,
  } = useAudioPlayer(audioUri);

  const formatTime = (ms: number) => {
    if (isNaN(ms)) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: any) => {
    if (!duration) return;
    const { locationX } = event.nativeEvent;
    const { width } = Dimensions.get('window');
    const containerWidth = width - (Spacing.md || 16) * 4; // Approx padding
    const percentage = Math.max(0, Math.min(1, locationX / containerWidth));
    seekTo(percentage * duration);
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  const currentChapter = useMemo(() => {
    if (!chapters || chapters.length === 0) return null;
    let current = chapters[0];
    for (let i = 0; i < chapters.length; i++) {
      if (position >= chapters[i].startTimeMs) {
        current = chapters[i];
      } else {
        break;
      }
    }
    return current;
  }, [position, chapters]);

  const renderSpeedButton = (speed: number) => (
    <TouchableOpacity
      key={speed}
      style={[styles.speedButton, rate === speed && styles.speedButtonActive]}
      onPress={() => setRate(speed)}
    >
      <Text style={[styles.speedButtonText, rate === speed && styles.speedButtonTextActive]}>
        {speed}x
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.bookTitle} numberOfLines={1}>{bookTitle}</Text>
        {currentChapter && (
          <Text style={styles.chapterTitle} numberOfLines={1}>{currentChapter.title}</Text>
        )}
      </View>

      <View style={styles.progressContainer}>
        <TouchableOpacity 
          style={styles.progressBarTrack} 
          activeOpacity={1}
          onPress={handleSeek}
        >
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          <View style={[styles.progressKnob, { left: `${progressPercentage}%` }]} />
        </TouchableOpacity>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={() => skipBack(15)} style={styles.controlButton}>
          <Ionicons name="play-back" size={32} color="#f8fafc" />
          <Text style={styles.skipText}>15</Text>
        </TouchableOpacity>

        {isLoading ? (
          <View style={styles.playButton}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : (
          <TouchableOpacity 
            onPress={isPlaying ? pause : play} 
            style={styles.playButton}
          >
            <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#ffffff" />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => skipForward(15)} style={styles.controlButton}>
          <Ionicons name="play-forward" size={32} color="#f8fafc" />
          <Text style={styles.skipText}>15</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.speedRow}>
        {[0.75, 1, 1.25, 1.5, 2].map(renderSpeedButton)}
      </View>

      {chapters && chapters.length > 0 && (
        <ScrollView style={styles.chapterList}>
          <Text style={styles.chapterListTitle}>Chapters</Text>
          {chapters.map((chapter, index) => {
            const isCurrent = currentChapter?.id === chapter.id;
            return (
              <TouchableOpacity 
                key={chapter.id || index}
                style={[styles.chapterItem, isCurrent && styles.chapterItemActive]}
                onPress={() => seekTo(chapter.startTimeMs)}
              >
                <Text style={[styles.chapterItemText, isCurrent && styles.chapterItemTextActive]}>
                  {chapter.title}
                </Text>
                <Text style={styles.chapterItemTime}>
                  {formatTime(chapter.startTimeMs)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: Spacing.md || 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl || 32,
  },
  bookTitle: {
    color: '#f8fafc',
    fontSize: FontSize.xl || 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  chapterTitle: {
    color: '#94a3b8',
    fontSize: FontSize.md || 16,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: Spacing.xl || 32,
  },
  progressBarTrack: {
    height: 32,
    justifyContent: 'center',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.primary || '#3b82f6',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 14,
  },
  progressKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary || '#3b82f6',
    position: 'absolute',
    top: 8,
    marginLeft: -8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: '#94a3b8',
    fontSize: FontSize.sm || 14,
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl || 32,
    gap: 40,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: '#f8fafc',
    fontSize: FontSize.xs || 12,
    marginTop: 4,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary || '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl || 32,
  },
  speedButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill || 9999,
    backgroundColor: '#1e293b',
  },
  speedButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  speedButtonText: {
    color: '#94a3b8',
    fontSize: FontSize.sm || 14,
    fontWeight: '600',
  },
  speedButtonTextActive: {
    color: Colors.primary || '#3b82f6',
  },
  chapterList: {
    flex: 1,
  },
  chapterListTitle: {
    color: '#f8fafc',
    fontSize: FontSize.lg || 18,
    fontWeight: 'bold',
    marginBottom: Spacing.md || 16,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md || 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  chapterItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  chapterItemText: {
    color: '#f8fafc',
    fontSize: FontSize.md || 16,
    flex: 1,
    marginRight: 16,
  },
  chapterItemTextActive: {
    color: Colors.primary || '#3b82f6',
    fontWeight: 'bold',
  },
  chapterItemTime: {
    color: '#94a3b8',
    fontSize: FontSize.sm || 14,
    fontVariant: ['tabular-nums'],
  },
});
