import { socialAuthProviders } from './methods';

export const lastLoginMethodCookie = { name: 'veo.last_login_method', maxAge: 60 * 60 * 24 * 30 };
const pending = 'pending';
const changed = new EventTarget();

export function isSupportedLoginMethod(value: string | null | undefined) {
  return value === 'email' || socialAuthProviders.some(({ providerId }) => providerId === value);
}

export function hasLastLoginMethodConsent(value: string | null | undefined) {
  return value === pending || isSupportedLoginMethod(value);
}

export function subscribeToLastLoginMethod(onChange: () => void) {
  changed.addEventListener('change', onChange);
  return () => changed.removeEventListener('change', onChange);
}

export function readLastLoginMethod() {
  if (typeof document === 'undefined') {
    return null;
  }
  const prefix = `${lastLoginMethodCookie.name}=`;
  const value = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);
  return hasLastLoginMethodConsent(value) ? value! : null;
}

export function setRememberLoginMethod(enabled: boolean) {
  if (enabled && readLastLoginMethod()) {
    return;
  }
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const maxAge = enabled ? lastLoginMethodCookie.maxAge : 0;
  document.cookie = `${lastLoginMethodCookie.name}=${enabled ? pending : ''}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
  changed.dispatchEvent(new Event('change'));
}
