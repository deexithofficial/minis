import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { AgeCheckScreen } from '../screens/AgeCheckScreen';
import { AgeBlockedScreen } from '../screens/AgeBlockedScreen';
import { InterestsScreen } from '../screens/InterestsScreen';
import { SaveProgressScreen } from '../screens/SaveProgressScreen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  AgeCheck: undefined;
  Interests: undefined;
  SaveProgress: undefined;
  Character: undefined;
  Notifications: undefined;
  AgeBlocked: undefined;
  SignIn: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="AgeCheck" component={AgeCheckScreen} />
      <Stack.Screen name="AgeBlocked" component={AgeBlockedScreen} />
      <Stack.Screen name="Interests" component={InterestsScreen} />
      <Stack.Screen name="SaveProgress" component={SaveProgressScreen} />
    </Stack.Navigator>
  );
}
