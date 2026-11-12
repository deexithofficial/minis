import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as users from '../../api/users';
import { ApiError } from '../../api/client';
import { InterestsScreen } from '../InterestsScreen';

jest.mock('../../api/users');
jest.mock('../../storage/tokenStorage');

test('Skip with nothing selected saves an empty list and navigates', async () => {
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><InterestsScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Skip'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('SaveProgress'));
  expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { interests: [] });
});

test('selecting chips and pressing Continue saves the selection', async () => {
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><InterestsScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Runner'));
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { interests: ['Runner'] }));
});

test('selecting a chip then pressing Skip saves the current selection, not an empty array', async () => {
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><InterestsScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Runner'));
  fireEvent.press(getByText('Skip'));
  await waitFor(() => expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { interests: ['Runner'] }));
  expect(users.updateMe).not.toHaveBeenCalledWith(expect.anything(), { interests: [] });
});

test('Back goes back to AgeCheck', () => {
  const goBack = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><InterestsScreen navigation={{ navigate: jest.fn(), goBack } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Back'));
  expect(goBack).toHaveBeenCalledTimes(1);
});

test('a failed save shows an inline error and does not navigate', async () => {
  (users.updateMe as jest.Mock).mockRejectedValue(new ApiError(500, 'Request failed'));
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><InterestsScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(getByText('Request failed')).toBeTruthy());
  expect(navigate).not.toHaveBeenCalled();
});
