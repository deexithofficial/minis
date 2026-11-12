import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as users from '../../api/users';
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
