import { createFileRoute } from '@tanstack/react-router';

import { ImprintPage } from '#/app/legal/imprint-page';

export const Route = createFileRoute('/imprint')({
  head: () => ({ meta: [{ title: 'Imprint · Veo' }] }),
  component: ImprintPage,
});
