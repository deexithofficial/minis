import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as users from '../../api/users';
import { AgeCheckScreen } from '../AgeCheckScreen';

jest.mock('../../api/users');
jest.mock('../../storage/tokenStorage');

test('a birth year exactly at the minimum age continues to Interests and saves it', async () => {
  const navigate = jest.fn();
  const thisYear = new Date().getFullYear();
  const { getByText, getByTestId } = render(
    <OnboardingProvider><AgeCheckScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent(getByTestId('year-picker'), 'onSelect', thisYear - 13);
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Interests'));
  expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { birthYear: thisYear - 13 });
});

test('a birth year one year under the minimum age blocks without saving', async () => {
  const navigate = jest.fn();
  const thisYear = new Date().getFullYear();
  const { getByText, getByTestId } = render(
    <OnboardingProvider><AgeCheckScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent(getByTestId('year-picker'), 'onSelect', thisYear - 12);
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('AgeBlocked'));
  expect(users.updateMe).not.toHaveBeenCalled();
});
