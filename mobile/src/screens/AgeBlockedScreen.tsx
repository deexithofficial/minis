import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    // navigate() would PUSH a duplicate AgeCheck onto the stack; popTo goes
    // back to the existing one instead, so the stack doesn't grow unbounded.
    navigation.popTo('AgeCheck');
  }

  function handleClose() {
    navigation.popTo('Welcome');
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlobMascot name="lightblue-sad" />
      <Text style={styles.headline}>Not quite yet</Text>
      <Text style={styles.subtext}>
        This app is for players 13 and over. Come back when you are older, we will be here.
      </Text>
      <PillButton label="Check my birth year" variant="primary" onPress={handleCheckBirthYear} />
      <Pressable onPress={handleClose}>
        <Text style={styles.link}>Close</Text>
      </Pressable>
    </SafeAreaView>
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
