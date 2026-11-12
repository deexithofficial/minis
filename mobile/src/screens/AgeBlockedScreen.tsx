import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/OnboardingStack';
import { PillButton } from '../components/PillButton';
import { BlobMascot } from '../components/BlobMascot';
import { colors } from '../theme/colors';
import { fonts, type as type_ } from '../theme/typography';

interface Props {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'AgeBlocked'>;
}

export function AgeBlockedScreen({ navigation }: Props) {
  function handleCheckBirthYear() {
    navigation.navigate('AgeCheck');
  }

  function handleClose() {
    navigation.navigate('Welcome');
  }

  return (
    <View style={styles.container}>
      <BlobMascot name="lightblue-sad" />
      <Text style={styles.headline}>Not quite yet</Text>
      <Text style={styles.subtext}>
        You need to be at least 13 years old to play. Double-check your birth year, or come back
        when you're old enough.
      </Text>
      <PillButton label="Check my birth year" variant="primary" onPress={handleCheckBirthYear} />
      <Pressable onPress={handleClose}>
        <Text style={styles.link}>Close</Text>
      </Pressable>
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
    textAlign: 'center',
  },
  subtext: {
    fontSize: type_.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  link: {
    fontSize: type_.body,
    color: colors.text,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});
