import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={voice.isAuto ? 'sparkles' : 'mic-outline'} 
                  size={14} 
                  color={isSelected ? Colors.primary : Colors.textSecondary} 
                  style={{ marginRight: 6 }}
                />
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
        {showAll ? 'All 30 Neural Narrators' : 'Featured Narrator Personas'}
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
            <View style={[styles.listIconContainer, isSelected && styles.listIconContainerSelected]}>
              <Ionicons 
                name={voice.isAuto ? 'sparkles' : 'mic'} 
                size={20} 
                color={isSelected ? Colors.primary : Colors.textSecondary} 
              />
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
                <Ionicons name="checkmark" size={14} color="#000000" />
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
        activeOpacity={0.7}
      >
        <Ionicons 
          name={showAll ? "chevron-up" : "chevron-down"} 
          size={14} 
          color={Colors.primary} 
          style={{ marginRight: 6 }} 
        />
        <Text style={styles.toggleAllText}>
          {showAll ? 'Show Curated Only' : 'Browse All 30 Gemini Voices'}
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
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedChip: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(226, 179, 80, 0.12)',
  },
  compactChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  selectedChipText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  listContainer: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    fontSize: FontSize.xxs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: Colors.textTertiary,
    fontWeight: '700',
    marginBottom: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedListItem: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(226, 179, 80, 0.06)',
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listIconContainerSelected: {
    borderColor: 'rgba(226, 179, 80, 0.4)',
    backgroundColor: 'rgba(226, 179, 80, 0.1)',
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
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  personaBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  personaText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  listVoiceDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  uncheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginLeft: Spacing.sm,
  },
  toggleAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: 4,
  },
  toggleAllText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
