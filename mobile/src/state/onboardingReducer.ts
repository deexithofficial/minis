export const MIN_AGE = 13;

// Wire shape of the backend's toPublicUser(). createdAt is a Date server-side
// but arrives as an ISO string after JSON serialization.
export interface PublicUser {
  id: string;
  email: string | null;
  isGuest: boolean;
  birthYear: number | null;
  interests: string[];
  characterLook: string | null;
  characterName: string | null;
  notificationsOptIn: boolean | null;
  createdAt: string;
}

export function isUnderMinimumAge(birthYear: number, now: Date = new Date()): boolean {
  return now.getFullYear() - birthYear < MIN_AGE;
}

export function toggleInterest(current: string[], interest: string): string[] {
  return current.includes(interest)
    ? current.filter((i) => i !== interest)
    : [...current, interest];
}
