import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '@/constants/theme';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  accent?: 'cyan' | 'purple' | 'none';
}

export function GlassCard({
  children,
  style,
  borderColor,
  accent = 'none',
}: GlassCardProps) {
  return (
    <View
      style={[
        styles.card,
        borderColor ? { borderColor } : null,
        accent === 'cyan' && styles.accentCyan,
        accent === 'purple' && styles.accentPurple,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  accentCyan: {
    borderColor: Colors.borderCyan,
  },
  accentPurple: {
    borderColor: Colors.borderPurple,
  },
});
