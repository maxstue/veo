import { socialAuthProviders } from './methods';

const cookieName = 'veo.last_login_method';
const cookieMaxAge = 60 * 60 * 24 * 30;
const pending = 'pending';
const oauthAttemptKey = 'veo.remember_sign_in_attempt';
const changed = new EventTarget();

function isSupportedLoginMethod(value: string | null) {
  return value === 'email' || socialAuthProviders.some(({ providerId }) => providerId === value);
}

export function subscribeToLastLoginMethod(onChange: () => void) {
  changed.addEventListener('change', onChange);
  window.addEventListener('pageshow', onChange);
  window.addEventListener('focus', onChange);
  return () => {
    changed.removeEventListener('change', onChange);
    window.removeEventListener('pageshow', onChange);
    window.removeEventListener('focus', onChange);
  };
}

export function readLastLoginMethod() {
  if (typeof document === 'undefined') {
    return null;
  }
  const prefix = `${cookieName}=`;
  const cookie = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));
  const value = cookie?.slice(prefix.length) ?? null;
  return value === pending || isSupportedLoginMethod(value) ? value : null;
}

function writeLastLoginMethod(value: string, maxAge: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${cookieName}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
  changed.dispatchEvent(new Event('change'));
}

export function setRememberLoginMethod(enabled: boolean) {
  if (!enabled || !readLastLoginMethod()) {
    writeLastLoginMethod(enabled ? pending : '', enabled ? cookieMaxAge : 0);
  }
}

export function rememberSuccessfulLogin(method: string) {
  // Check consent in the browser after authentication. A response cannot restore a revoked preference.
  if (readLastLoginMethod() && isSupportedLoginMethod(method)) {
    writeLastLoginMethod(method, cookieMaxAge);
  }
}

export function getSocialLoginCallback(providerId: string, returnTo: string) {
  if (!readLastLoginMethod()) {
    return returnTo;
  }

  try {
    const attempt = crypto.randomUUID();
    sessionStorage.setItem(oauthAttemptKey, `${attempt}:${providerId}`);
    return `/auth?${new URLSearchParams({ completeSignIn: attempt, returnTo })}`;
  } catch {
    return returnTo;
  }
}

export function completeRememberedSocialLogin(attempt: string) {
  try {
    const [storedAttempt, method] = sessionStorage.getItem(oauthAttemptKey)?.split(':') ?? [];
    if (storedAttempt !== attempt || !method) {
      return;
    }

    sessionStorage.removeItem(oauthAttemptKey);
    rememberSuccessfulLogin(method);
  } catch {
    // Authentication and navigation still work if the browser blocks session storage.
  }
}
