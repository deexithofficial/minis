import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export interface PillButtonProps {
  label: string;
  onPress: () => void;
  // 'mutedSecondary' LOOKS disabled (dimmed, muted color) but stays tappable —
  // for controls like the social sign-in buttons that must still register a
  // tap (to show a "coming soon" notice) while reading as disabled.
  variant?: 'primary' | 'secondary' | 'disabled' | 'mutedSecondary';
  testID?: string;
}

export function PillButton({ label, onPress, variant = 'primary', testID }: PillButtonProps) {
  const isDisabled = variant === 'disabled';
  const isSecondaryLike = variant === 'secondary' || variant === 'mutedSecondary';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        isSecondaryLike && styles.secondary,
        variant === 'mutedSecondary' && styles.muted,
        isDisabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.primaryLabel,
          isSecondaryLike && styles.secondaryLabel,
          variant === 'mutedSecondary' && styles.mutedLabel,
          isDisabled && styles.disabledLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.lime,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  disabled: {
    backgroundColor: colors.elevated,
    opacity: 0.5,
  },
  muted: {
    opacity: 0.4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryLabel: {
    color: colors.background,
  },
  secondaryLabel: {
    color: colors.text,
  },
  disabledLabel: {
    color: colors.textMuted,
  },
  mutedLabel: {
    color: colors.textMuted,
  },
});
