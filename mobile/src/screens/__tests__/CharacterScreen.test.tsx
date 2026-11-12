import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingProvider } from '../../state/OnboardingContext';
import * as users from '../../api/users';
import { CharacterScreen } from '../CharacterScreen';

jest.mock('../../api/users');
jest.mock('../../storage/tokenStorage');

test('selecting a look and a name, then Continue, saves both', async () => {
  const navigate = jest.fn();
  const { getByText, getByTestId, getByPlaceholderText } = render(
    <OnboardingProvider><CharacterScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByTestId('look-pink'));
  fireEvent.changeText(getByPlaceholderText('Pick a name'), 'Pip');
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Notifications'));
  expect(users.updateMe).toHaveBeenCalledWith(expect.anything(), { characterLook: 'pink', characterName: 'Pip' });
});

test('Skip for now navigates without saving', () => {
  const navigate = jest.fn();
  const { getByText } = render(
    <OnboardingProvider><CharacterScreen navigation={{ navigate, goBack: jest.fn() } as any} /></OnboardingProvider>
  );
  fireEvent.press(getByText('Skip for now'));
  expect(navigate).toHaveBeenCalledWith('Notifications');
  expect(users.updateMe).not.toHaveBeenCalled();
});
