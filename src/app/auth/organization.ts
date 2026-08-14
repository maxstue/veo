import { createAccessControl } from 'better-auth/plugins/access';

export const organizationStatements = {
  organization: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
} as const;

export const organizationAccess = createAccessControl(organizationStatements);

export const ownerRole = organizationAccess.newRole({
  organization: [],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
});

export const memberRole = organizationAccess.newRole({
  organization: [],
  member: [],
  invitation: [],
});

export const organizationRoles = { owner: ownerRole, member: memberRole };
