import { type ComponentProps } from 'react';

import { cn } from '#/shared/lib/utils';

const pageContainerClassName = 'mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10';

export function PageShell({ className, ...props }: ComponentProps<'main'>) {
  return <main className={cn(pageContainerClassName, className)} {...props} />;
}
