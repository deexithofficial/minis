import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../navigation/OnboardingStack';
import { useOnboarding } from '../state/OnboardingContext';
import { signup } from '../api/auth';
import { ApiError } from '../api/client';
import { PillButton } from '../components/PillButton';
import { BlobMascot } from '../components/BlobMascot';
import { colors } from '../theme/colors';
import { fonts, type as type_ } from '../theme/typography';

interface Props {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'SaveProgress'>;
}

export function SaveProgressScreen({ navigation }: Props) {
  const { token, setSession } = useOnboarding();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleComingSoon() {
    Alert.alert('Coming soon');
  }

  function handleNotNow() {
    navigation.navigate('Character');
  }

  async function handleCreateAccount() {
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    try {
      const { token: newToken, user } = await signup({ email, password, guestToken: token ?? undefined });
      setSession(newToken, user);
      navigation.navigate('Character');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <View style={styles.container}>
      <BlobMascot name="coral-celebrating" />
      <Text style={styles.headline}>Save your progress</Text>
      <Text style={styles.subtext}>Create an account so you never lose your streak.</Text>

      <PillButton label="Continue with Apple" variant="secondary" onPress={handleComingSoon} />
      <PillButton label="Continue with Google" variant="secondary" onPress={handleComingSoon} />
      <PillButton label="Continue with email" variant="primary" onPress={() => setShowForm(true)} />

      {showForm ? (
        <View style={styles.form}>
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
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PillButton label="Create account" variant="primary" onPress={handleCreateAccount} />
        </View>
      ) : null}

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
  form: {
    gap: 12,
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
