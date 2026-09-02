import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FEATURED_VOICES, ALL_VOICES, AUTO_VOICE } from '@/constants/voices';
import { Voice } from '@/types/book';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  compact?: boolean;
}

export function VoiceSelector({ selectedVoice, onSelectVoice, compact = false }: VoiceSelectorProps) {
  const [showAll, setShowAll] = useState(false);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactScroll}>
          {FEATURED_VOICES.map((voice) => {
            const isSelected = voice.id === selectedVoice;
            return (
              <TouchableOpacity
                key={voice.id}
                style={[
                  styles.compactChip,
                  isSelected && styles.selectedChip,
                ]}
                onPress={() => onSelectVoice(voice.id)}
              >
                <Text style={styles.compactEmoji}>
                  {voice.isAuto ? '✨' : voice.gender === 'male' ? '👨' : voice.gender === 'female' ? '👩' : '🎙️'}
                </Text>
                <Text style={[styles.compactChipText, isSelected && styles.selectedChipText]}>
                  {voice.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // Regular / Detailed View (Settings & Customization)
  const voicesToDisplay = showAll ? ALL_VOICES : FEATURED_VOICES;

  return (
    <View style={styles.listContainer}>
      <Text style={styles.sectionHeader}>
        {showAll ? 'All Narrators (30)' : 'Curated Narrators'}
      </Text>

      {voicesToDisplay.map((voice) => {
        const isSelected = voice.id === selectedVoice;
        return (
          <TouchableOpacity
            key={voice.id}
            style={[styles.listItem, isSelected && styles.selectedListItem]}
            onPress={() => onSelectVoice(voice.id)}
            activeOpacity={0.7}
          >
            <View style={styles.listIconContainer}>
              <Text style={styles.listEmoji}>
                {voice.isAuto ? '✨' : voice.gender === 'male' ? '👨' : voice.gender === 'female' ? '👩' : '🎙️'}
              </Text>
            </View>

            <View style={styles.listTextContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.listVoiceName}>{voice.name}</Text>
                {voice.persona && (
                  <View style={styles.personaBadge}>
                    <Text style={styles.personaText}>{voice.persona}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.listVoiceDesc}>{voice.description}</Text>
            </View>

            {isSelected ? (
              <View style={styles.checkCircle}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            ) : (
              <View style={styles.uncheckCircle} />
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.toggleAllButton}
        onPress={() => setShowAll(!showAll)}
        activeOpacity={0.6}
      >
        <Text style={styles.toggleAllText}>
          {showAll ? '← Show Curated Only' : '+ Browse All 30 Voices'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    marginVertical: 4,
  },
  compactScroll: {
    paddingRight: Spacing.md,
    gap: 8,
  },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedChip: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  compactEmoji: {
    fontSize: 15,
    marginRight: 6,
  },
  compactChipText: {
    color: '#94a3b8',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  selectedChipText: {
    color: '#60a5fa',
  },
  listContainer: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedListItem: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  listIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  listEmoji: {
    fontSize: 22,
  },
  listTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  listVoiceName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#f8fafc',
  },
  personaBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  personaText: {
    fontSize: 11,
    color: '#93c5fd',
    fontWeight: '600',
  },
  listVoiceDesc: {
    fontSize: FontSize.xs,
    color: '#94a3b8',
    lineHeight: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  checkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uncheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    marginLeft: Spacing.sm,
  },
  toggleAllButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: 4,
  },
  toggleAllText: {
    color: '#60a5fa',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
