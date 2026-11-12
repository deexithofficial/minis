import React, { createContext, useCallback, useContext, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as tokenStorage from '../storage/tokenStorage';
import type { PublicUser } from './onboardingReducer';

interface OnboardingContextValue {
  token: string | null;
  user: PublicUser | null;
  setSession(token: string, user: PublicUser): void;
  clearSession(): void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);

  const setSession = useCallback((newToken: string, newUser: PublicUser) => {
    setToken(newToken);
    setUser(newUser);
    tokenStorage.saveToken(newToken);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    tokenStorage.clearToken();
  }, []);

  const value: OnboardingContextValue = { token, user, setSession, clearSession };

  return (
    <OnboardingContext.Provider value={value}>
      {/* Every screen uses SafeAreaView/useSafeAreaInsets; this is the one
          provider all of them (and every screen test, which renders through
          OnboardingProvider) sit under. */}
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
