import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '../state/OnboardingContext';
import { colors } from '../theme/colors';
import { fonts, type as type_ } from '../theme/typography';

export function HomeScreen() {
  const { user } = useOnboarding();

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Onboarding complete</Text>
      <Text style={styles.subtext}>{user?.email ?? 'Guest'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: type_.headline,
    color: colors.text,
  },
  subtext: {
    fontSize: type_.body,
    color: colors.textMuted,
  },
});
