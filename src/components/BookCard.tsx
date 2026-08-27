import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Book } from '@/types/book';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { ProgressBar } from './ProgressBar';

interface BookCardProps {
  book: Book;
  onPress: () => void;
}

export function BookCard({ book, onPress }: BookCardProps) {
  const isReady = book.status === 'ready';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return '#eab308'; // yellow
      case 'extracting': return '#3b82f6'; // blue
      case 'generating_audio': return '#a855f7'; // purple
      case 'ready': return '#22c55e'; // green
      case 'error': return '#ef4444'; // red
      default: return '#64748b'; // slate
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'extracting': return 'Extracting Text...';
      case 'generating_audio': return 'Generating Audio...';
      case 'ready': return 'Ready';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} min ${seconds} sec`;
  };

  const formatDate = (date: Date | string | number) => {
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title || 'Untitled'}
        </Text>
      </View>
      
      <View style={styles.statusRow}>
        <View style={[styles.badge, { backgroundColor: getStatusColor(book.status) }]}>
          <Text style={styles.badgeText}>{getStatusText(book.status)}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        {isReady && book.durationMs ? (
          <Text style={styles.detailText}>{formatDuration(book.durationMs)}</Text>
        ) : null}
        <Text style={styles.detailText}>
          {formatDate(book.createdAt)}
        </Text>
        {book.voiceId && (
          <Text style={styles.detailText}>Voice: {book.voiceId}</Text>
        )}
      </View>

      {!isReady && book.progress !== undefined && (
        <View style={styles.progressContainer}>
          <ProgressBar progress={book.progress} color={getStatusColor(book.status)} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: Spacing.md || 16,
  },
  header: {
    marginBottom: Spacing.sm || 8,
  },
  title: {
    color: '#f8fafc',
    fontSize: FontSize.lg || 18,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md || 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm || 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: FontSize.xs || 12,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailText: {
    color: '#94a3b8',
    fontSize: FontSize.sm || 14,
    marginRight: Spacing.sm || 8,
    marginBottom: 4,
  },
  progressContainer: {
    marginTop: Spacing.md || 16,
  },
});
