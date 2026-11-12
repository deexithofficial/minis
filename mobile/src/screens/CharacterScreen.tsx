import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/OnboardingStack';
import { useOnboarding } from '../state/OnboardingContext';
import { updateMe } from '../api/users';
import { ApiError } from '../api/client';
import { ProgressDots } from '../components/ProgressDots';
import { PillButton } from '../components/PillButton';
import { BlobMascot } from '../components/BlobMascot';
import { colors } from '../theme/colors';
import { fonts, type as type_ } from '../theme/typography';

interface Props {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Character'>;
}

type CharacterLook = 'lime' | 'pink' | 'sky';

const LOOKS: CharacterLook[] = ['lime', 'pink', 'sky'];

export function CharacterScreen({ navigation }: Props) {
  const { token } = useOnboarding();
  const [look, setLook] = useState<CharacterLook | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    setBusy(true);
    try {
      await updateMe(token ?? '', { characterLook: look, characterName: name });
      navigation.navigate('Notifications');
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

  function handleSkip() {
    navigation.navigate('Notifications');
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>
      <ProgressDots stepCount={3} activeIndex={2} />
      <BlobMascot name="yellow-happy" />
      <Text style={styles.headline}>Make your character</Text>
      <View style={styles.swatches}>
        {LOOKS.map((option) => (
          <Pressable
            key={option}
            testID={`look-${option}`}
            onPress={() => setLook(option)}
            style={[
              styles.swatch,
              { backgroundColor: colors[option] },
              look === option && styles.swatchSelected,
            ]}
          />
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Pick a name"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PillButton label="Continue" variant={busy ? 'disabled' : 'primary'} onPress={handleContinue} />
      <PillButton label="Skip for now" variant="secondary" onPress={handleSkip} />
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
  swatches: {
    flexDirection: 'row',
    gap: 12,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.elevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: type_.body,
    color: colors.text,
  },
  error: {
    color: colors.pink,
    fontSize: type_.caption,
  },
});
