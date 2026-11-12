import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as auth from '../../api/auth';
import { ApiError } from '../../api/client';
import { SaveProgressScreen } from '../SaveProgressScreen';

jest.mock('../../api/auth');
jest.mock('../../storage/tokenStorage');

test('Apple/Google show a coming-soon alert and never call signup', () => {
  jest.spyOn(Alert, 'alert');
  const { getByText } = render(
    <OnboardingProvider><SaveProgressScreen navigation={{ navigate: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Continue with Apple'));
  fireEvent.press(getByText('Continue with Google'));
  expect(Alert.alert).toHaveBeenCalledTimes(2);
  expect(auth.signup).not.toHaveBeenCalled();
});

test('mismatched passwords show an inline error and do not call signup', () => {
  const { getByText, getByPlaceholderText } = render(
    <OnboardingProvider><SaveProgressScreen navigation={{ navigate: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Continue with email'));
  fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'longenough');
  fireEvent.changeText(getByPlaceholderText('Confirm password'), 'different');
  fireEvent.press(getByText('Create account'));
  expect(getByText('Passwords do not match.')).toBeTruthy();
  expect(auth.signup).not.toHaveBeenCalled();
});

test('a duplicate-email signup shows the server message', async () => {
  (auth.signup as jest.Mock).mockRejectedValue(new ApiError(409, 'Email already in use'));
  const { getByText, getByPlaceholderText } = render(
    <OnboardingProvider><SaveProgressScreen navigation={{ navigate: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Continue with email'));
  fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'longenough');
  fireEvent.changeText(getByPlaceholderText('Confirm password'), 'longenough');
  fireEvent.press(getByText('Create account'));
  await waitFor(() => expect(getByText('Email already in use')).toBeTruthy());
});
