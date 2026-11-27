import { lastLoginMethodClient, organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { lastLoginMethodCookieName } from './last-login-method';
import { organizationAccess, organizationRoles } from './organization';

export const authClient = createAuthClient({
  plugins: [
    lastLoginMethodClient({ cookieName: lastLoginMethodCookieName }),
    organizationClient({ ac: organizationAccess, roles: organizationRoles, teams: { enabled: false } }),
  ],
});
