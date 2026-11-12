import React from 'react';
import { render } from '@testing-library/react-native';
import * as Font from 'expo-font';
import App from '../App';

jest.mock('expo-font');

test('shows a loading state until fonts finish loading, then the Welcome screen', async () => {
  (Font.useFonts as jest.Mock).mockReturnValue([false]);
  const { getByText, rerender } = render(<App />);
  expect(getByText('Loading…')).toBeTruthy();
  (Font.useFonts as jest.Mock).mockReturnValue([true]);
  rerender(<App />);
  expect(getByText('Start playing')).toBeTruthy();
});
