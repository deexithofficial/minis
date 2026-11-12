import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as tokenStorage from '../../storage/tokenStorage';
import { OnboardingProvider, useOnboarding } from '../OnboardingContext';

jest.mock('../../storage/tokenStorage');

function Probe() {
  const { token, setSession } = useOnboarding();
  return <Text onPress={() => setSession('tok', { id: '1' } as any)}>{token ?? 'none'}</Text>;
}

test('setSession stores the token and persists it', async () => {
  const { getByText } = render(<OnboardingProvider><Probe /></OnboardingProvider>);
  await act(async () => { getByText('none').props.onPress(); });
  expect(tokenStorage.saveToken).toHaveBeenCalledWith('tok');
});
