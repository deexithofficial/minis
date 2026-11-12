import React from 'react';
import { render } from '@testing-library/react-native';
import { BlobMascot, MASCOTS } from '../BlobMascot';

test('renders an Image sourced from the requested mascot', () => {
  const { getByTestId } = render(<BlobMascot name="green-thinking" />);
  expect(getByTestId('blob-mascot').props.source).toBe(MASCOTS['green-thinking']);
});

test('every mascot name used by the plan resolves to an asset', () => {
  for (const name of ['green-thinking', 'yellow-happy', 'blue-pointing', 'coral-celebrating', 'pink-shy', 'lightblue-sad'] as const) {
    expect(MASCOTS[name]).toBeDefined();
  }
});
