import { colors } from '../colors';

test('exposes the exact design token hex values', () => {
  expect(colors).toEqual({
    background: '#0F1014', surface: '#212124', elevated: '#2E2F35', dotInactive: '#3F4047',
    text: '#F4F2EC', textMuted: '#A3A6B2', lime: '#C6F24E', violet: '#6A47F5', pink: '#FF9FD0', sky: '#7DB8FF',
  });
});
