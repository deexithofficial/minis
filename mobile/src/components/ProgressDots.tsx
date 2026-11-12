import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

export interface ProgressDotsProps {
  stepCount: number;
  activeIndex: number;
}

export function ProgressDots({ stepCount, activeIndex }: ProgressDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: stepCount }, (_, index) => (
        <View
          key={index}
          testID="progress-dot"
          style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.lime,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.dotInactive,
  },
});
