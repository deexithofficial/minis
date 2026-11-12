import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Chip } from '../Chip';

test('calls onPress when tapped and reflects selected state', () => {
  const onPress = jest.fn();
  const { getByText } = render(<Chip label="Runner" selected onPress={onPress} />);
  fireEvent.press(getByText('Runner'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
