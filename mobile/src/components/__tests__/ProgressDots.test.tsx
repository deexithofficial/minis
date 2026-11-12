import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressDots } from '../ProgressDots';

test('renders one dot per step', () => {
  const { getAllByTestId } = render(<ProgressDots stepCount={3} activeIndex={1} />);
  expect(getAllByTestId('progress-dot')).toHaveLength(3);
});
