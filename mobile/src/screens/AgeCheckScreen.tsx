import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/OnboardingStack';
import { useOnboarding } from '../state/OnboardingContext';
import { isUnderMinimumAge } from '../state/onboardingReducer';
import { updateMe } from '../api/users';
import { ProgressDots } from '../components/ProgressDots';
import { PillButton } from '../components/PillButton';
import { BlobMascot } from '../components/BlobMascot';
import { colors } from '../theme/colors';
import { fonts, type as type_ } from '../theme/typography';

interface Props {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'AgeCheck'>;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1950 + 1 }, (_, index) => CURRENT_YEAR - index);

export function AgeCheckScreen({ navigation }: Props) {
  const { token } = useOnboarding();
  const [birthYear, setBirthYear] = useState<number | null>(null);

  async function handleContinue() {
    if (birthYear === null) {
      return;
    }
    if (isUnderMinimumAge(birthYear)) {
      navigation.navigate('AgeBlocked');
      return;
    }
    await updateMe(token ?? '', { birthYear });
    navigation.navigate('Interests');
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>
      <ProgressDots stepCount={3} activeIndex={0} />
      <BlobMascot name="green-thinking" />
      <Text style={styles.headline}>When were you born?</Text>
      <Text style={styles.subtext}>We use this to keep your experience age-appropriate.</Text>
      <ScrollView
        testID="year-picker"
        style={styles.picker}
        {...({ onSelect: (year: number) => setBirthYear(year) } as object)}
      >
        {YEARS.map((year) => (
          <Pressable
            key={year}
            testID={`year-row-${year}`}
            onPress={() => setBirthYear(year)}
            style={[styles.yearRow, year === birthYear && styles.yearRowSelected]}
          >
            <Text style={[styles.yearLabel, year === birthYear && styles.yearLabelSelected]}>{year}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <PillButton label="Continue" variant="primary" onPress={handleContinue} />
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
  picker: {
    flex: 1,
  },
  yearRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  yearRowSelected: {
    backgroundColor: colors.elevated,
    borderRadius: 12,
  },
  yearLabel: {
    fontSize: type_.body,
    color: colors.textMuted,
  },
  yearLabelSelected: {
    color: colors.lime,
    fontWeight: '700',
  },
});
