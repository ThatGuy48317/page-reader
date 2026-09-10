import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, Spacing } from '@/constants/theme';

interface BookCoverProps {
  title: string;
  voiceName?: string;
  coverUrl?: string;
  size?: 'small' | 'medium' | 'hero';
  style?: StyleProp<ViewStyle>;
}

// Curated luxury book cloth palettes
const COVER_PALETTES = [
  {
    bg: '#0c1829',
    spine: '#08101c',
    accent: '#e2b350',
    text: '#f8fafc',
    tag: '#93c5fd',
    icon: 'book' as const,
  },
  {
    bg: '#0a2218',
    spine: '#061710',
    accent: '#34d399',
    text: '#f8fafc',
    tag: '#a7f3d0',
    icon: 'leaf' as const,
  },
  {
    bg: '#2a0c16',
    spine: '#1c070e',
    accent: '#fb7185',
    text: '#f8fafc',
    tag: '#fecdd3',
    icon: 'sparkles' as const,
  },
  {
    bg: '#14171d',
    spine: '#0d0f13',
    accent: '#e2b350',
    text: '#f8fafc',
    tag: '#fde68a',
    icon: 'compass' as const,
  },
  {
    bg: '#1b122c',
    spine: '#120b1e',
    accent: '#c084fc',
    text: '#f8fafc',
    tag: '#e9d5ff',
    icon: 'moon' as const,
  },
  {
    bg: '#291508',
    spine: '#1a0d05',
    accent: '#fbbf24',
    text: '#f8fafc',
    tag: '#fde68a',
    icon: 'flame' as const,
  },
];

function getPaletteForTitle(title: string) {
  let hash = 0;
  for (let i = 0; i < (title || '').length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COVER_PALETTES.length;
  return COVER_PALETTES[index];
}

export function BookCover({ title, voiceName, coverUrl, size = 'medium', style }: BookCoverProps) {
  const [imgError, setImgError] = useState(false);
  const palette = getPaletteForTitle(title || 'Untitled');

  const dimensions = {
    small: { width: 52, height: 72, radius: 6, titleSize: 9, spineWidth: 5, iconSize: 12 },
    medium: { width: 88, height: 120, radius: 10, titleSize: 12, spineWidth: 8, iconSize: 18 },
    hero: { width: 220, height: 300, radius: 18, titleSize: 20, spineWidth: 16, iconSize: 34 },
  }[size];

  const cleanTitle = (title || 'Untitled Book').trim();
  const showImage = !!coverUrl && !imgError;

  return (
    <View
      style={[
        styles.container,
        {
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: dimensions.radius,
          backgroundColor: palette.bg,
        },
        size === 'hero' && styles.heroShadow,
        size === 'medium' && styles.mediumShadow,
        style,
      ]}
    >
      {showImage ? (
        <>
          <Image
            source={{ uri: coverUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
          {/* Subtle 3D Spine Overlay on top of cover image */}
          <View
            style={[
              styles.spine,
              {
                width: dimensions.spineWidth,
                borderTopLeftRadius: dimensions.radius,
                borderBottomLeftRadius: dimensions.radius,
                backgroundColor: 'rgba(0,0,0,0.35)',
              },
            ]}
          />
        </>
      ) : (
        <>
          {/* 3D Spine Fold Shadow on Left Edge */}
          <View
            style={[
              styles.spine,
              {
                width: dimensions.spineWidth,
                borderTopLeftRadius: dimensions.radius,
                borderBottomLeftRadius: dimensions.radius,
                backgroundColor: palette.spine,
              },
            ]}
          />

          {/* Subtle Embossed Foil Border */}
          <View
            style={[
              styles.embossFrame,
              {
                borderRadius: Math.max(dimensions.radius - 3, 3),
                borderColor: palette.accent,
              },
            ]}
          />

          {/* Cover Content */}
          <View style={[styles.content, { paddingLeft: dimensions.spineWidth + 6 }]}>
            {/* Top Decorative Emblem */}
            <View style={styles.topRow}>
              <Ionicons
                name={palette.icon}
                size={dimensions.iconSize}
                color={palette.accent}
                style={{ opacity: 0.85 }}
              />
            </View>

            {/* Center Title */}
            <View style={styles.titleWrapper}>
              <Text
                style={[
                  styles.bookTitle,
                  {
                    fontSize: dimensions.titleSize,
                    color: palette.text,
                  },
                ]}
                numberOfLines={size === 'small' ? 3 : size === 'medium' ? 4 : 5}
              >
                {cleanTitle}
              </Text>
            </View>

            {/* Bottom Narrator Foil Stamp (Only on medium & hero) */}
            {size !== 'small' && (
              <View style={styles.footerRow}>
                <View style={[styles.narratorPill, { borderColor: `${palette.accent}40` }]}>
                  <Text
                    style={[styles.narratorText, { color: palette.tag, fontSize: size === 'hero' ? 11 : 9 }]}
                    numberOfLines={1}
                  >
                    {voiceName ? (voiceName === 'auto' ? 'Full Ensemble Cast' : `Narrated by ${voiceName}`) : 'PaperEcho Edition'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  mediumShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  spine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  embossFrame: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 5,
    right: 5,
    borderWidth: 1,
    opacity: 0.25,
  },
  content: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
    zIndex: 3,
  },
  topRow: {
    alignItems: 'flex-end',
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontWeight: '800',
    letterSpacing: 0.3,
    lineHeight: undefined,
  },
  footerRow: {
    marginTop: 4,
  },
  narratorPill: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 0.5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  narratorText: {
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
