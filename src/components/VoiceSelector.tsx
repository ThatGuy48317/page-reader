import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VOICES } from '@/constants/voices';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  compact?: boolean;
}

export function VoiceSelector({ selectedVoice, onSelectVoice, compact = false }: VoiceSelectorProps) {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {VOICES.map((voice) => {
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
                <Ionicons
                  name={voice.gender === 'male' ? 'man' : 'woman'}
                  size={16}
                  color={isSelected ? Colors.primary || '#3b82f6' : '#94a3b8'}
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

  return (
    <View style={styles.listContainer}>
      {VOICES.map((voice) => {
        const isSelected = voice.id === selectedVoice;
        return (
          <TouchableOpacity
            key={voice.id}
            style={[styles.listItem, isSelected && styles.selectedListItem]}
            onPress={() => onSelectVoice(voice.id)}
          >
            <View style={styles.listIconContainer}>
              <Ionicons
                name={voice.gender === 'male' ? 'man' : 'woman'}
                size={24}
                color={isSelected ? Colors.primary || '#3b82f6' : '#94a3b8'}
              />
            </View>
            <View style={styles.listTextContainer}>
              <Text style={styles.listVoiceName}>{voice.name}</Text>
              <Text style={styles.listVoiceDesc}>{voice.description}</Text>
            </View>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary || '#3b82f6'} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
  },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill || 9999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedChip: {
    borderColor: Colors.primary || '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  compactChipText: {
    color: '#94a3b8',
    marginLeft: 6,
    fontSize: FontSize.sm || 14,
    fontWeight: '500',
  },
  selectedChipText: {
    color: Colors.primary || '#3b82f6',
  },
  listContainer: {
    gap: Spacing.sm || 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: Spacing.md || 16,
    borderRadius: BorderRadius.md || 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedListItem: {
    borderColor: Colors.primary || '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  listIconContainer: {
    marginRight: Spacing.md || 16,
  },
  listTextContainer: {
    flex: 1,
  },
  listVoiceName: {
    color: '#f8fafc',
    fontSize: FontSize.md || 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listVoiceDesc: {
    color: '#94a3b8',
    fontSize: FontSize.sm || 14,
  },
});
