import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as auth from '../../api/auth';
import { WelcomeScreen } from '../WelcomeScreen';

jest.mock('../../api/auth');
jest.mock('../../storage/tokenStorage');

test('Start playing creates a guest session and navigates to AgeCheck', async () => {
  (auth.guestSignIn as jest.Mock).mockResolvedValue({ token: 'g', user: { id: '1', isGuest: true } });
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><WelcomeScreen navigation={{ navigate } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Start playing'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('AgeCheck'));
});

test('I have an account navigates to SignIn without calling the API', () => {
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><WelcomeScreen navigation={{ navigate } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('I have an account'));
  expect(navigate).toHaveBeenCalledWith('SignIn');
  expect(auth.guestSignIn).not.toHaveBeenCalled();
});
