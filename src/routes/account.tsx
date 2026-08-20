import { createFileRoute, redirect } from '@tanstack/react-router';

import {
  AccountDeletion,
  AccountHeading,
  AccountLayout,
  AccountSecuritySection,
  AccountSummary,
} from '#/app/account/account-page';
import { getAccount } from '#/app/account/api';

export const Route = createFileRoute('/account')({
  beforeLoad: ({ context }) => {
    if (!context.session) {
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
