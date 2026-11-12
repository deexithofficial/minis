import React from 'react';
import { Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { OnboardingProvider } from './src/state/OnboardingContext';
import { OnboardingStack } from './src/navigation/OnboardingStack';

export default function App() {
  const [fontsLoaded] = useFonts({
    'CalSans-SemiBold': require('./src/assets/fonts/CalSans-SemiBold.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <OnboardingProvider>
      <NavigationContainer>
        <OnboardingStack />
      </NavigationContainer>
    </OnboardingProvider>
  );
}
