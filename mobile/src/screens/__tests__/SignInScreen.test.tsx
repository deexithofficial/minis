import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as auth from '../../api/auth';
import { ApiError } from '../../api/client';
import { SignInScreen } from '../SignInScreen';

jest.mock('../../api/auth');
jest.mock('../../storage/tokenStorage');

test('shows an inline error and does not navigate on a failed login', async () => {
  (auth.login as jest.Mock).mockRejectedValue(new ApiError(401, 'Invalid email or password'));
  const navigate = jest.fn();
  const reset = jest.fn();
  const { getByText, getByPlaceholderText } = render(
    <OnboardingProvider><SignInScreen navigation={{ navigate, reset } as any} /></OnboardingProvider>
  );
  fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'wrong');
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(getByText('Incorrect email or password.')).toBeTruthy());
  expect(navigate).not.toHaveBeenCalled();
  expect(reset).not.toHaveBeenCalled();
});

test('a successful login resets the stack so Home is the only entry', async () => {
  (auth.login as jest.Mock).mockResolvedValue({ token: 't', user: { id: '1', isGuest: false } });
  const navigate = jest.fn();
  const reset = jest.fn();
  const { getByText, getByPlaceholderText } = render(
    <OnboardingProvider><SignInScreen navigation={{ navigate, reset } as any} /></OnboardingProvider>
  );
  fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'longenough');
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] }));
  expect(navigate).not.toHaveBeenCalled();
});
