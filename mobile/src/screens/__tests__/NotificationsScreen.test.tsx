import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as users from '../../api/users';
import { ApiError } from '../../api/client';
import { NotificationsScreen } from '../NotificationsScreen';

jest.mock('expo-notifications');
jest.mock('../../api/users');
jest.mock('../../storage/tokenStorage');

test('Turn on reminders requests permission and resets the stack to Home even if denied', async () => {
  (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
  const navigate = jest.fn();
  const reset = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><NotificationsScreen navigation={{ navigate, reset } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Turn on reminders'));
  await waitFor(() => expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] }));
  expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { notificationsOptIn: true });
});

test('Not now saves opt-in false without requesting OS permission', async () => {
  const navigate = jest.fn();
  const reset = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><NotificationsScreen navigation={{ navigate, reset } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Not now'));
  await waitFor(() => expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { notificationsOptIn: false }));
  expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Home' }] });
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
});

test('a failed save on Turn on reminders shows an inline error and does not reset the stack', async () => {
  (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  (users.updateMe as jest.Mock).mockRejectedValue(new ApiError(500, 'Request failed'));
  const navigate = jest.fn();
  const reset = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><NotificationsScreen navigation={{ navigate, reset } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Turn on reminders'));
  await waitFor(() => expect(getByText('Request failed')).toBeTruthy());
  expect(reset).not.toHaveBeenCalled();
});

test('a failed save on Not now shows an inline error and does not reset the stack', async () => {
  (users.updateMe as jest.Mock).mockRejectedValue(new ApiError(500, 'Request failed'));
  const navigate = jest.fn();
  const reset = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><NotificationsScreen navigation={{ navigate, reset } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Not now'));
  await waitFor(() => expect(getByText('Request failed')).toBeTruthy());
  expect(reset).not.toHaveBeenCalled();
});
