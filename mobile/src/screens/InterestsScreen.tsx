import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/OnboardingStack';
import { useOnboarding } from '../state/OnboardingContext';
import { toggleInterest } from '../state/onboardingReducer';
import { updateMe } from '../api/users';
import { Chip } from '../components/Chip';
import { ProgressDots } from '../components/ProgressDots';
import { PillButton } from '../components/PillButton';
import { BlobMascot } from '../components/BlobMascot';
import { colors } from '../theme/colors';
import { fonts, type as type_ } from '../theme/typography';

interface Props {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Interests'>;
}

export const INTEREST_OPTIONS = [
  'Runner',
  'Puzzle',
  'Casual',
  'Arcade',
  'Racing',
  'Cozy',
  'Word',
  'Strategy',
  'Sports',
  'Rhythm',
];

export function InterestsScreen({ navigation }: Props) {
  const { token } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  async function save() {
    await updateMe(token ?? '', { interests: selected });
    navigation.navigate('SaveProgress');
  }

  return (
    <View style={styles.container}>
      <ProgressDots stepCount={3} activeIndex={1} />
      <BlobMascot name="blue-pointing" />
      <Text style={styles.headline}>What do you like to play?</Text>
      <Text style={styles.subtext}>Pick a few, or none at all — you can always change this later.</Text>
      <View style={styles.chips}>
        {INTEREST_OPTIONS.map((label) => (
          <Chip
            key={label}
            label={label}
            selected={selected.includes(label)}
            onPress={() => setSelected(toggleInterest(selected, label))}
          />
        ))}
      </View>
      <PillButton label="Continue" variant="primary" onPress={save} />
      <PillButton label="Skip" variant="secondary" onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  chips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignContent: 'flex-start',
  },
});
