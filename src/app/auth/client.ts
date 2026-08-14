import { organizationClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { organizationAccess, organizationRoles } from './organization';

export const authClient = createAuthClient({
  plugins: [organizationClient({ ac: organizationAccess, roles: organizationRoles, teams: { enabled: false } })],
});
