<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# TypeScript style

- Prefer inferred return types for function implementations.
- Do not add explicit function return annotations when TypeScript can infer the same type.
- Keep explicit return types only when inference cannot preserve the intended contract, such as
  for overload or type signatures and type predicates.

# Documentation location

Project documentation belongs in the Veo Linear project, not in the repository. This includes
research results, architecture and product decisions, evaluations, migration plans, operational
plans, meeting notes, and ticket completion summaries.

- Create or update a Linear document and link it to the relevant Linear issue or project.
- Keep implementation details and verification results in the relevant Linear issue when a
  separate document is unnecessary.
- Do not create repository documentation files or add project-decision sections to `README.md`
  unless the user explicitly requests repository documentation.
- Repository documentation is allowed only when it is required to use, develop, test, deploy, or
  operate the checked-in code. Keep such documentation narrowly focused on the code and link to
  Linear for broader context and decisions.
- Before changing documentation, check Linear first and update the existing source of truth
  instead of duplicating it in the repository.

<!-- sonar:begin:codex-secrets-on-read -->

# SonarQube secrets scanning for files protocol

Before reading any file in this workspace, scan it for secrets with the deterministic scanner:

```bash
sonar analyze secrets <path/to/file>
```

If the command reports that the file contains a secret, **do not read the file**. Instead:

1. Inform the user that the file appears to contain a secret or credential and that reading it would expose the value in chat history, logs, and any downstream telemetry.
2. Advise them to rotate the leaked credential at its source of truth and remove it from the file.
3. Do not proceed with the original request until the secret has been removed.

<!-- sonar:end:codex-secrets-on-read -->
