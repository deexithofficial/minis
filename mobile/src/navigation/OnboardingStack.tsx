import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { SignInScreen } from '../screens/SignInScreen';

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
    </Stack.Navigator>
  );
}
