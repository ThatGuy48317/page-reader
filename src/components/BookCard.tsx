import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Book } from '@/types/book';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { ProgressBar } from './ProgressBar';
import { getExpirationInfo } from '@/utils/expiration';

interface BookCardProps {
  book: Book;
  onPress: () => void;
}

export function BookCard({ book, onPress }: BookCardProps) {
  const isReady = book.status === 'ready';
  const expInfo = getExpirationInfo(book.expiresAt);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return '#eab308'; // yellow
      case 'extracting': return '#3b82f6'; // blue
      case 'generating_audio': return '#a855f7'; // purple
      case 'ready': return '#22c55e'; // green
      case 'expired': return '#ef4444'; // red
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
      case 'expired': return 'Audio Expired';
      case 'error': return 'Error';
      default: return 'Processing';
    }
  };

  const formatDuration = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (date: Date | string | number | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title || 'Untitled Book'}
        </Text>
      </View>
      
      <View style={styles.statusRow}>
        <View style={[styles.badge, { backgroundColor: getStatusColor(book.status) }]}>
          <Text style={styles.badgeText}>{getStatusText(book.status)}</Text>
        </View>

        {isReady && (
          <View style={[
            styles.expBadge, 
            { backgroundColor: expInfo.badgeBg, borderColor: expInfo.badgeBorder }
          ]}>
            <Text style={[styles.expBadgeText, { color: expInfo.badgeTextColor }]}>
              {expInfo.label}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.detailsRow}>
        {isReady && book.duration ? (
          <Text style={styles.detailText}>⏱ {formatDuration(book.duration)}</Text>
        ) : null}
        {book.voiceName && (
          <Text style={styles.detailText}>🎙 {book.voiceName}</Text>
        )}
        {book.createdAt && (
          <Text style={styles.detailText}>{formatDate(book.createdAt)}</Text>
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
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    marginBottom: 10,
  },
  title: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  expBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  expBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  detailText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 12,
  },
});
