import React, { useRef } from 'react';
import { Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { CitationSourceType } from '@/types';

interface CitationChipProps {
  index: number;
  onPress: () => void;
  active?: boolean;
  sourceType?: CitationSourceType;
}

export function CitationChip({
  index,
  onPress,
  active = false,
  sourceType = 'document',
}: CitationChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  const isWeb = sourceType === 'web' || sourceType === 'search';
  const isLive = sourceType === 'live_api';

  const badgeColor = isLive
    ? '#10B981'
    : isWeb
    ? '#2563EB'
    : Colors.primary;

  const badgeBg = isLive
    ? 'rgba(16, 185, 129, 0.1)'
    : isWeb
    ? 'rgba(37, 99, 235, 0.08)'
    : 'rgba(22, 163, 74, 0.08)';

  const badgeBorder = isLive
    ? 'rgba(16, 185, 129, 0.3)'
    : isWeb
    ? 'rgba(37, 99, 235, 0.3)'
    : 'rgba(22, 163, 74, 0.3)';

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.wrapper]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.container,
          { backgroundColor: badgeBg, borderColor: badgeBorder },
          active && { backgroundColor: badgeColor, borderColor: badgeColor },
          pressed && { opacity: 0.8 },
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel={`Source citation ${index}`}
      >
        <Text
          style={[
            styles.text,
            { color: badgeColor },
            active && styles.activeText,
          ]}
        >
          [{index}]
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: '700',
  },
  activeText: {
    color: '#FFFFFF',
  },
});
