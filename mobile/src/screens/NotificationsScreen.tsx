import React, { useState } from 'react';
import * as Notifications from 'expo-notifications';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/OnboardingStack';
import { useOnboarding } from '../state/OnboardingContext';
import { updateMe } from '../api/users';
import { ApiError } from '../api/client';
import { PillButton } from '../components/PillButton';
import { BlobMascot } from '../components/BlobMascot';
import { colors } from '../theme/colors';
import { fonts, type as type_ } from '../theme/typography';

interface Props {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Notifications'>;
}

export function NotificationsScreen({ navigation }: Props) {
  const { token } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goToHome() {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }

  async function handleTurnOnReminders() {
    setError(null);
    setBusy(true);
    try {
      await Notifications.requestPermissionsAsync();
      await updateMe(token ?? '', { notificationsOptIn: true });
      goToHome();
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

  async function handleNotNow() {
    setError(null);
    setBusy(true);
    try {
      await updateMe(token ?? '', { notificationsOptIn: false });
      goToHome();
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
      <BlobMascot name="pink-shy" />
      <Text style={styles.headline}>Keep your streak alive</Text>
      <Text style={styles.subtext}>
        Want a nudge when your streak is about to end? That is all we will send.
      </Text>
      <View style={styles.preview}>
        <Text style={styles.previewTitle}>Minis</Text>
        <Text style={styles.previewBody}>Your streak is waiting! Come back and play today.</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PillButton
        label="Turn on reminders"
        variant={busy ? 'disabled' : 'primary'}
        onPress={handleTurnOnReminders}
      />
      <PillButton label="Not now" variant={busy ? 'disabled' : 'secondary'} onPress={handleNotNow} />
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
  headline: {
    fontFamily: fonts.display,
    fontSize: type_.headline,
    color: colors.text,
  },
  subtext: {
    fontSize: type_.body,
    color: colors.textMuted,
  },
  preview: {
    borderWidth: 1,
    borderColor: colors.elevated,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  previewTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  previewBody: {
    color: colors.textMuted,
  },
  error: {
    color: colors.pink,
    fontSize: type_.caption,
  },
});
