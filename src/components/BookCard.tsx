import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '@/types/book';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { ProgressBar } from './ProgressBar';
import { BookCover } from './BookCover';
import { getExpirationInfo } from '@/utils/expiration';

interface BookCardProps {
  book: Book;
  onPress: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export function BookCard({ book, onPress, onRename, onDelete }: BookCardProps) {
  const isReady = book.status === 'ready';
  const expInfo = getExpirationInfo(book.expiresAt);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return '#f59e0b'; // amber
      case 'extracting': return '#6366f1'; // indigo
      case 'generating_audio': return '#a855f7'; // purple
      case 'ready': return '#10b981'; // emerald
      case 'expired': return '#ef4444'; // crimson
      case 'error': return '#ef4444'; // crimson
      default: return '#64748b'; // slate
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Uploading';
      case 'extracting': return 'Transcribing Text';
      case 'generating_audio': return 'Synthesizing Audio';
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

  const formatDate = (date: any) => {
    if (!date) return '';
    let d: Date;
    if (typeof date?.toDate === 'function') {
      d = date.toDate();
    } else if (typeof date?.seconds === 'number') {
      d = new Date(date.seconds * 1000);
    } else {
      d = new Date(date);
    }
    if (isNaN(d.getTime())) return 'Just now';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <Pressable 
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} 
      onPress={onPress}
    >
      {/* Mini Book Cover Jacket Thumbnail */}
      <BookCover 
        title={book.title} 
        voiceName={book.voiceName} 
        size="small" 
        style={styles.coverThumbnail}
      />

      {/* Book Metadata & Info */}
      <View style={styles.infoColumn}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title || 'Untitled Audiobook'}
        </Text>

        <View style={styles.metaRow}>
          {book.voiceName && (
            <View style={styles.narratorTag}>
              <Ionicons name="mic-outline" size={10} color={Colors.primary} style={{ marginRight: 3 }} />
              <Text style={styles.narratorTagText}>{book.voiceName}</Text>
            </View>
          )}

          {isReady && book.duration ? (
            <Text style={styles.durationText}>
              {formatDuration(book.duration)}
            </Text>
          ) : null}

          {book.createdAt ? (
            <Text style={styles.dateText}>{formatDate(book.createdAt)}</Text>
          ) : null}
        </View>

        {/* Status / Retention Badges */}
        <View style={styles.statusRow}>
          <View style={[styles.badge, { backgroundColor: `${getStatusColor(book.status)}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(book.status) }]} />
            <Text style={[styles.badgeText, { color: getStatusColor(book.status) }]}>
              {getStatusText(book.status)}
            </Text>
          </View>

          {isReady && (
            <View style={[
              styles.expBadge, 
              { backgroundColor: expInfo.badgeBg, borderColor: expInfo.badgeBorder }
            ]}>
              <Ionicons 
                name={expInfo.isExpired ? "alert-circle" : "time-outline"} 
                size={10} 
                color={expInfo.badgeTextColor} 
                style={{ marginRight: 3 }} 
              />
              <Text style={[styles.expBadgeText, { color: expInfo.badgeTextColor }]}>
                {expInfo.label}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar for Active Processing */}
        {!isReady && book.progress !== undefined && (
          <View style={styles.progressContainer}>
            <ProgressBar progress={book.progress} color={getStatusColor(book.status)} height={4} />
          </View>
        )}
      </View>

      <View style={styles.actionsGroup}>
        {onRename && (
          <Pressable 
            onPress={(e) => {
              e.stopPropagation();
              onRename();
            }}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            hitSlop={6}
          >
            <Ionicons name="pencil-outline" size={16} color={Colors.textTertiary} />
          </Pressable>
        )}

        {onDelete && (
          <Pressable 
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={({ pressed }) => [styles.actionButton, pressed && styles.deleteButtonPressed]}
            hitSlop={6}
          >
            <Ionicons name="trash-outline" size={16} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardPressed: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderLight,
  },
  coverThumbnail: {
    alignSelf: 'flex-start',
  },
  infoColumn: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  narratorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  narratorTagText: {
    fontSize: FontSize.xxs,
    color: Colors.primary,
    fontWeight: '600',
  },
  durationText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  expBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
  },
  chevron: {
    marginLeft: 4,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionButton: {
    padding: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(226, 179, 80, 0.15)',
  },
  deleteButtonPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
});
