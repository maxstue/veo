const relativeUrlOrigin = 'https://veo.invalid';

/**
 * Applies Veo's privacy rules to a URL before it is sent to Sentry.
 *
 * Query strings and fragments are removed because they can contain tokens or user-provided values. Invitation tokens
 * are embedded in Veo's route path, so the token segment in `/invite/<token>` is replaced with `[redacted]` as well.
 * Absolute URLs remain absolute and relative paths remain relative.
 *
 * This function only sanitizes known URL data. It must not be treated as a general-purpose personal-data scrubber.
 *
 * @param value - Absolute URL or relative path to sanitize.
 * @returns The sanitized URL without query, fragment, or invitation token.
 */
export function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value, relativeUrlOrigin);
    const pathname = redactSensitivePath(url.pathname);

    return url.origin === relativeUrlOrigin ? pathname : `${url.origin}${pathname}`;
  } catch {
    return redactSensitivePath(value.split(/[?#]/, 1)[0]);
  }
}

/**
 * Redacts sensitive values stored in known Veo route path segments.
 *
 * @param pathname - URL pathname without a query string or fragment.
 * @returns The pathname with sensitive route parameters replaced.
 */
function redactSensitivePath(pathname: string): string {
  return pathname.replace(/(^|\/)invite\/[^/]+/, '$1invite/[redacted]');
}
