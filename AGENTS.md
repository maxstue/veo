<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

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

# UI components

- Prefer existing shadcn components and primitives over custom implementations.
- Before adding or composing UI, check the official shadcn registry and documentation at
  https://ui.shadcn.com/docs and https://ui.shadcn.com/docs/components to find the appropriate component.
- Add custom UI only when no suitable shadcn component or primitive exists, or when the product requires
  behavior that the available components cannot support.

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

# Secrets scanning

- Do not run a SonarQube secrets scan before reading individual files.
- The repository Git hook performs the secrets scan for staged changes before commit.
- Always run `sonar analyze secrets` once as a final verification for the changed files, regardless of
  whether a Git hook is present.
