import { createLink, type LinkComponent } from "@tanstack/react-router";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Button, buttonVariants } from "./button";

type ButtonLinkBaseProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof buttonVariants>;

const ButtonLinkBase = React.forwardRef<HTMLAnchorElement, ButtonLinkBaseProps>(
  ({ size, variant, ...props }, ref) => (
    <Button
      nativeButton={false}
      render={<a ref={ref} {...props} />}
      size={size}
      variant={variant}
    />
  ),
);

const CreatedButtonLink = createLink(ButtonLinkBase);

export const ButtonLink: LinkComponent<typeof ButtonLinkBase> = (props) => (
  <CreatedButtonLink preload="intent" {...props} />
);
