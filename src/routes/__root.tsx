import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import { AppErrorPage } from "#/components/app-error-page";
import { NotFoundPage } from "#/components/not-found-page";
import { ThemeProvider } from "#/components/theme-provider";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "color-scheme",
        content: "light dark",
      },
      {
        title: "Veo — Bingo for better meetings",
      },
      {
        name: "description",
        content:
          "Veo makes daily stand-ups and team meetings more engaging with collaborative bingo.",
      },
      {
        property: "og:title",
        content: "Veo — Bingo for better meetings",
      },
      {
        property: "og:description",
        content:
          "Veo makes daily stand-ups and team meetings more engaging with collaborative bingo.",
      },
      {
        property: "og:image",
        content: "/brand/social-preview.png",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        rel: "icon",
        href: "/brand/favicon-32.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        rel: "apple-touch-icon",
        href: "/brand/apple-touch-icon.png",
        sizes: "180x180",
      },
      {
        rel: "manifest",
        href: "/site.webmanifest",
      },
    ],
  }),
  errorComponent: AppErrorPage,
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
