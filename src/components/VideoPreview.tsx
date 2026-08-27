import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface VideoPreviewProps {
  videoUri: string;
}

export function VideoPreview({ videoUri }: VideoPreviewProps) {
  // Extract filename for display if possible
  const filename = videoUri.split('/').pop() || 'Unknown File';

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="videocam" size={48} color="#94a3b8" />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>Video Selected</Text>
        <Text style={styles.path} numberOfLines={1} ellipsizeMode="middle">
          {filename}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: BorderRadius.md || 8,
    padding: Spacing.md || 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm || 4,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md || 16,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    color: '#f8fafc',
    fontSize: FontSize.md || 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  path: {
    color: '#94a3b8',
    fontSize: FontSize.sm || 14,
  },
});
