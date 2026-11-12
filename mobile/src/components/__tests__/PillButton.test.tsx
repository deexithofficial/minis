import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PillButton } from '../PillButton';

test('fires onPress when enabled, not when disabled', () => {
  const onPress = jest.fn();
  const { getByText, rerender } = render(<PillButton label="Go" onPress={onPress} />);
  fireEvent.press(getByText('Go'));
  expect(onPress).toHaveBeenCalledTimes(1);
  rerender(<PillButton label="Go" onPress={onPress} variant="disabled" />);
  fireEvent.press(getByText('Go'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('mutedSecondary LOOKS disabled but still fires onPress', () => {
  const onPress = jest.fn();
  const { getByText } = render(<PillButton label="Continue with Apple" onPress={onPress} variant="mutedSecondary" />);
  fireEvent.press(getByText('Continue with Apple'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
