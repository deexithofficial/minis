import React from 'react';
import * as Notifications from 'expo-notifications';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/OnboardingStack';
import { useOnboarding } from '../state/OnboardingContext';
import { updateMe } from '../api/users';
import { PillButton } from '../components/PillButton';
import { BlobMascot } from '../components/BlobMascot';
import { colors } from '../theme/colors';
import { fonts, type as type_ } from '../theme/typography';

interface Props {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Notifications'>;
}

export function NotificationsScreen({ navigation }: Props) {
  const { token } = useOnboarding();

  async function handleTurnOnReminders() {
    await Notifications.requestPermissionsAsync();
    await updateMe(token ?? '', { notificationsOptIn: true });
    navigation.navigate('Home');
  }

  async function handleNotNow() {
    await updateMe(token ?? '', { notificationsOptIn: false });
    navigation.navigate('Home');
  }

  return (
    <View style={styles.container}>
      <BlobMascot name="pink-shy" />
      <Text style={styles.headline}>Keep your streak alive</Text>
      <Text style={styles.subtext}>
        Turn on reminders so you never miss a day of play.
      </Text>
      <View style={styles.preview}>
        <Text style={styles.previewTitle}>Minis</Text>
        <Text style={styles.previewBody}>Your streak is waiting! Come back and play today.</Text>
      </View>
      <PillButton label="Turn on reminders" variant="primary" onPress={handleTurnOnReminders} />
      <PillButton label="Not now" variant="secondary" onPress={handleNotNow} />
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
});
