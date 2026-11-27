import { createFileRoute } from '@tanstack/react-router';

import { PrivacyPage } from '#/app/legal/privacy-page';

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [{ title: 'Privacy policy · Veo' }] }),
  component: PrivacyPage,
});
