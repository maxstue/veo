export const appLocale = 'en';

export function formatAppDate(value: Date) {
  return new Intl.DateTimeFormat(appLocale, { dateStyle: 'medium' }).format(value);
}
