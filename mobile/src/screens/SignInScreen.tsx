import React, { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/OnboardingStack';
import { useOnboarding } from '../state/OnboardingContext';
import { login } from '../api/auth';
import { ApiError } from '../api/client';
import { PillButton } from '../components/PillButton';
import { colors } from '../theme/colors';
import { fonts, type as type_ } from '../theme/typography';

interface Props {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'SignIn'>;
}

export function SignInScreen({ navigation }: Props) {
  const { setSession } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    try {
      const { token, user } = await login({ email, password });
      setSession(token, user);
      // Home becomes the sole stack entry so a back-swipe can't re-enter
      // onboarding and re-submit a signup with a now-non-guest token.
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Incorrect email or password.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headline}>Sign in</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PillButton label="Continue" variant="primary" onPress={handleContinue} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: type_.headline,
    color: colors.text,
    marginBottom: 8,
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
