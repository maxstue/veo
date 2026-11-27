import { socialAuthProviders } from './methods';

export const lastLoginMethodCookieName = 'veo.last_login_method';
export const lastLoginMethodCookieMaxAge = 60 * 60 * 24 * 30;
export const pendingLastLoginMethod = 'pending';

export function isSupportedLoginMethod(value: string | null | undefined) {
  return value === 'email' || socialAuthProviders.some(({ providerId }) => providerId === value);
}
