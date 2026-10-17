import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: PrimaryButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
        };
      case 'outline':
        return {
          container: styles.outlineContainer,
          text: styles.outlineText,
        };
      case 'danger':
        return {
          container: styles.dangerContainer,
          text: styles.dangerText,
        };
      case 'primary':
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.baseContainer,
          variantStyles.container,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabledContainer,
          style,
        ]}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? '#FFFFFF' : Colors.primaryCyan}
          />
        ) : (
          <>
            {icon && icon}
            <Text
              style={[
                styles.baseText,
                variantStyles.text,
                disabled && styles.disabledText,
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    minHeight: 46,
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  baseText: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryContainer: {
    backgroundColor: Colors.primaryCyan,
    shadowColor: Colors.primaryCyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryContainer: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  secondaryText: {
    color: Colors.secondary,
  },
  outlineContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  outlineText: {
    color: Colors.textPrimary,
  },
  dangerContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerText: {
    color: Colors.error,
  },
  pressed: {
    opacity: 0.85,
  },
  disabledContainer: {
    opacity: 0.5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledText: {
    color: Colors.textMuted,
  },
});
