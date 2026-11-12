import React from 'react';
import { Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { OnboardingProvider } from './src/state/OnboardingContext';
import { OnboardingStack } from './src/navigation/OnboardingStack';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'CalSans-SemiBold': require('./src/assets/fonts/CalSans-SemiBold.otf'),
  });

  if (fontError) {
    // eslint-disable-next-line no-console
    console.error('Font failed to load, proceeding with the system fallback', fontError);
  }

  // Proceed once fonts have either loaded or definitively failed — otherwise
  // a font-load error would leave the app stuck on this screen forever.
  if (!fontsLoaded && !fontError) {
    return (
      <View>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <OnboardingProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <OnboardingStack />
      </NavigationContainer>
    </OnboardingProvider>
  );
}
