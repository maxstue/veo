import { Link } from '@tanstack/react-router';

import { ThemeToggle } from '#/shared/components/theme-toggle';

import { AuthControls } from './auth-controls';
import { VeoLogo } from './veo-logo';

export function AppHeader() {
  return (
    <header className='bg-card/75 flex items-center justify-between rounded-xl border px-4 py-3 shadow-sm backdrop-blur sm:px-5'>
      <Link className='flex items-center gap-2 no-underline' to='/' aria-label='Veo home'>
        <VeoLogo />
      </Link>
      <div className='flex items-center gap-3'>
        <ThemeToggle />
        <AuthControls />
      </div>
    </header>
  );
}
