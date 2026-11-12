import { apiRequest } from './client';
import type { PublicUser } from '../state/onboardingReducer';

type AuthResult = { token: string; user: PublicUser };

export function guestSignIn(): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/guest', { method: 'POST' });
}

export function signup(params: { email: string; password: string; guestToken?: string }): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/signup', {
    method: 'POST',
    body: { email: params.email, password: params.password },
    token: params.guestToken,
  });
}

export function login(params: { email: string; password: string }): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/login', {
    method: 'POST',
    body: { email: params.email, password: params.password },
  });
}
