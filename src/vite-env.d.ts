/** Enables strict checking for project-specific keys on `import.meta.env`. */
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

/** Client environment variables exposed by Vite at build time. */
interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN: string;
}

/** Provides the strictly typed Vite environment on `import.meta`. */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
