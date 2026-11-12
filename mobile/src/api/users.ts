import { apiRequest } from './client';
import type { PublicUser } from '../state/onboardingReducer';

export function getMe(token: string): Promise<PublicUser> {
  return apiRequest<PublicUser>('/users/me', { token });
}

export function updateMe(
  token: string,
  patch: Partial<Pick<PublicUser, 'birthYear' | 'interests' | 'characterLook' | 'characterName' | 'notificationsOptIn'>>,
): Promise<PublicUser> {
  return apiRequest<PublicUser>('/users/me', { method: 'PATCH', body: patch, token });
}
