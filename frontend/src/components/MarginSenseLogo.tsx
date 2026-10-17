import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

interface MarginSenseLogoProps {
  size?: 'compact' | 'large';
}

export function MarginSenseLogo({ size = 'compact' }: MarginSenseLogoProps) {
  const isLarge = size === 'large';
  const iconSize = isLarge ? 40 : 24;

  return (
    <View style={[styles.container, isLarge && styles.largeContainer]}>
      <View style={styles.brandRow}>
        {/* Rupee coin icon with bar-chart inlay */}
        <View style={[styles.coinIcon, { width: iconSize, height: iconSize, borderRadius: iconSize / 2 }]}>
          {/* Inner bar chart representation */}
          <View style={styles.barsRow}>
            <View style={[styles.bar, { height: isLarge ? 10 : 6 }]} />
            <View style={[styles.bar, { height: isLarge ? 16 : 10 }, styles.barTall]} />
            <View style={[styles.bar, { height: isLarge ? 12 : 7 }]} />
          </View>
          {/* Rupee ₹ overlay — top left corner micro-tag */}
          <View style={styles.rupeeTag}>
            <Text style={[styles.rupeeChar, { fontSize: isLarge ? 8 : 6 }]}>₹</Text>
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.wordmark, isLarge && styles.largeWordmark]}>
            <Text style={styles.marginText}>Margin</Text>
            <Text style={styles.senseText}>Sense</Text>
            <Text style={styles.aiText}> AI</Text>
          </Text>
        </View>
      </View>

      {isLarge && (
        <Text style={styles.tagline}>Autonomous Profit Guardian · ₹ INR</Text>
      )}
    </View>
  );
}

// Keep the old DocuMindLogo export name as a re-export so existing screens
// that import DocuMindLogo still compile without changes.
export { MarginSenseLogo as DocuMindLogo };

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  largeContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinIcon: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 1,
    opacity: 0.85,
  },
  barTall: {
    opacity: 1,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
  },
  rupeeTag: {
    position: 'absolute',
    top: 2,
    left: 3,
    opacity: 0.7,
  },
  rupeeChar: {
    fontFamily: Fonts.mono,
    color: Colors.primary,
    fontWeight: '700',
  },
  textContainer: {
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 17,
    fontFamily: Fonts.mono,
    letterSpacing: -0.3,
    fontWeight: '700',
  },
  largeWordmark: {
    fontSize: 26,
    letterSpacing: -0.5,
  },
  marginText: {
    color: Colors.textPrimary,
  },
  senseText: {
    color: Colors.primary,
  },
  aiText: {
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  tagline: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: Fonts.mono,
    color: Colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
