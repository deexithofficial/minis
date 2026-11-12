import React, { createContext, useCallback, useContext, useState } from 'react';
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

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
