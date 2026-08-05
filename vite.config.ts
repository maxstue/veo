import { defineConfig, lazyPlugins, loadEnv } from "vite-plus";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    staged: {
      "*": "vp check --fix",
    },
    fmt: {
      ignorePatterns: ["src/routeTree.gen.ts"],
    },
    lint: {
      ignorePatterns: ["src/routeTree.gen.ts"],
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
    test: {
      include: ["src/**/*.test.{ts,tsx}"],
      passWithNoTests: true,
    },
    resolve: { tsconfigPaths: true },
    plugins: lazyPlugins(() => [
      devtools(),
      mode === "test" ? undefined : cloudflare({ viteEnvironment: { name: "ssr" } }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
      sentryTanstackStart({
        org: "maxstue",
        project: "veo",
        authToken: env.SENTRY_AUTH_TOKEN,
        autoInstrumentMiddleware: false,
        tunnelRoute: true,
        // Upload only when CI provides the private token.
        sourcemaps: env.SENTRY_AUTH_TOKEN ? undefined : { disable: true },
        telemetry: false,
      }),
    ]),
  };
});

export default config;
