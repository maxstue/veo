import { createLink, type LinkComponent } from '@tanstack/react-router';
import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '#/shared/lib/utils';

import { buttonVariants } from './button';

type ButtonLinkBaseProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & VariantProps<typeof buttonVariants>;

const ButtonLinkBase = React.forwardRef<HTMLAnchorElement, ButtonLinkBaseProps>(
  ({ className, size, variant, ...props }, ref) => (
    <a ref={ref} className={cn(buttonVariants({ className, size, variant }))} data-slot='button' {...props} />
  ),
);

const CreatedButtonLink = createLink(ButtonLinkBase);

export const ButtonLink: LinkComponent<typeof ButtonLinkBase> = (props) => (
  <CreatedButtonLink preload='intent' {...props} />
);
