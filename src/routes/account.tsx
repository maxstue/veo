import { createFileRoute, redirect } from '@tanstack/react-router';

import {
  AccountDeletion,
  AccountHeading,
  AccountLayout,
  AccountSecuritySection,
  AccountSummary,
} from '#/app/account/account-page';
import { getAccount } from '#/app/account/api';
import { getViewer } from '#/app/teams/api';

export const Route = createFileRoute('/account')({
  beforeLoad: async () => {
    if (!(await getViewer())) {
      throw redirect({ to: '/auth', search: { returnTo: '/account' } });
    }
  },
  loader: () => getAccount(),
  component: AccountRoute,
});

function AccountRoute() {
  const account = Route.useLoaderData();
  return (
    <AccountLayout>
      <AccountHeading />
      <AccountSummary account={account} />
      <AccountSecuritySection email={account.user.email} />
      <AccountDeletion />
    </AccountLayout>
  );
}
