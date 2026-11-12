import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/OnboardingStack';
import { useOnboarding } from '../state/OnboardingContext';
import { toggleInterest } from '../state/onboardingReducer';
import { updateMe } from '../api/users';
import { ApiError } from '../api/client';
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await updateMe(token ?? '', { interests: selected });
      navigation.navigate('SaveProgress');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>
      <ProgressDots stepCount={3} activeIndex={1} />
      <BlobMascot name="blue-pointing" />
      <Text style={styles.headline}>What do you like?</Text>
      <Text style={styles.subtext}>Pick a few. You can change this later.</Text>
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PillButton label="Continue" variant={busy ? 'disabled' : 'primary'} onPress={save} />
      <PillButton label="Skip" variant={busy ? 'disabled' : 'secondary'} onPress={save} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    gap: 16,
  },
  back: {
    alignSelf: 'flex-start',
  },
  backLabel: {
    color: colors.textMuted,
    fontSize: type_.body,
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
  error: {
    color: colors.pink,
    fontSize: type_.caption,
  },
});
