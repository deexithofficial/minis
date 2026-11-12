import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as users from '../../api/users';
import { NotificationsScreen } from '../NotificationsScreen';

jest.mock('expo-notifications');
jest.mock('../../api/users');
jest.mock('../../storage/tokenStorage');

test('Turn on reminders requests permission and saves opt-in true even if denied', async () => {
  (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><NotificationsScreen navigation={{ navigate } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Turn on reminders'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Home'));
  expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { notificationsOptIn: true });
});

test('Not now saves opt-in false without requesting OS permission', async () => {
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><NotificationsScreen navigation={{ navigate } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Not now'));
  await waitFor(() => expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { notificationsOptIn: false }));
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
});
