import { type ComponentProps } from 'react';

import { cn } from '#/shared/lib/utils';

export function HomeContainer({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10', className)} {...props} />;
}
