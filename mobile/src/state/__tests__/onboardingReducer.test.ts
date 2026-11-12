import { isUnderMinimumAge, toggleInterest, MIN_AGE } from '../onboardingReducer';

test('allows exactly the minimum age and blocks one year younger', () => {
  const now = new Date('2026-06-01');
  expect(MIN_AGE).toBe(13);
  expect(isUnderMinimumAge(2026 - 13, now)).toBe(false);
  expect(isUnderMinimumAge(2026 - 12, now)).toBe(true);
});

test('toggleInterest adds an absent interest and removes a present one', () => {
  expect(toggleInterest([], 'Runner')).toEqual(['Runner']);
  expect(toggleInterest(['Runner'], 'Runner')).toEqual([]);
});
