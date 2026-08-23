export type AuthMethod = {
  providerId: string;
  label: string;
};

export type SocialAuthProvider = {
  providerId: string;
  label: string;
};

export const socialAuthProviders: SocialAuthProvider[] = [
  { providerId: 'google', label: 'Google' },
  { providerId: 'microsoft', label: 'Microsoft' },
];

const providerLabels: Record<string, string> = {
  apple: 'Apple',
  credential: 'Email & password',
  discord: 'Discord',
  'email-password': 'Email & password',
  github: 'GitHub',
  google: 'Google',
  microsoft: 'Microsoft',
};

export function getAuthMethods(providerIds: string[]) {
  return [...new Set(providerIds)].map((providerId) => ({
    providerId,
    label: providerLabels[providerId] ?? 'Other sign-in method',
  }));
}
