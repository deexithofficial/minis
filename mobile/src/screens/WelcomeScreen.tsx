import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/OnboardingStack';
import { useOnboarding } from '../state/OnboardingContext';
import { guestSignIn } from '../api/auth';
import { PillButton } from '../components/PillButton';
import { BlobMascot } from '../components/BlobMascot';
import { colors } from '../theme/colors';
import { fonts, type as type_ } from '../theme/typography';

interface Props {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;
}

export function WelcomeScreen({ navigation }: Props) {
  const { setSession } = useOnboarding();

  async function handleStartPlaying() {
    const { token, user } = await guestSignIn();
    setSession(token, user);
    navigation.navigate('AgeCheck');
  }

  function handleHaveAccount() {
    navigation.navigate('SignIn');
  }

  return (
    <View style={styles.container}>
      <View style={styles.mascots}>
        <BlobMascot name="yellow-happy" size={96} />
        <BlobMascot name="coral-celebrating" size={120} />
        <BlobMascot name="pink-shy" size={96} />
      </View>
      <Text style={styles.wordmark}>Minis</Text>
      <Text style={styles.headline}>Play, create, and learn together</Text>
      <Text style={styles.subtext}>A playful world built just for you.</Text>
      <PillButton label="Start playing" variant="primary" onPress={handleStartPlaying} />
      <Pressable onPress={handleHaveAccount}>
        <Text style={styles.link}>I have an account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  mascots: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: type_.hero,
    color: colors.text,
  },
  headline: {
    fontSize: type_.headline,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtext: {
    fontSize: type_.body,
    color: colors.text,
    textAlign: 'center',
  },
  link: {
    fontSize: type_.body,
    color: colors.text,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});
