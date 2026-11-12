import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AgeBlockedScreen } from '../AgeBlockedScreen';

test('Check my birth year pops back to the existing AgeCheck screen instead of pushing a new one', () => {
  const popTo = jest.fn();
  const { getByText } = render(<AgeBlockedScreen navigation={{ popTo } as any} />);
  fireEvent.press(getByText('Check my birth year'));
  expect(popTo).toHaveBeenCalledWith('AgeCheck');
});

test('Close pops back to the existing Welcome screen instead of pushing a new one', () => {
  const popTo = jest.fn();
  const { getByText } = render(<AgeBlockedScreen navigation={{ popTo } as any} />);
  fireEvent.press(getByText('Close'));
  expect(popTo).toHaveBeenCalledWith('Welcome');
});
