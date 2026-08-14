<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./public/brand/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./public/brand/logo.svg">
  <img src="./public/brand/logo.png" alt="Veo" width="190">
</picture>

[![Quality gate status](https://sonarcloud.io/api/project_badges/measure?project=maxstue_veo&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=maxstue_veo)

Veo is a collaborative bingo game for daily stand-ups, reviews, and other team meetings.
Team members collect familiar phrases and situations, receive a personal board, and mark
matches as the meeting unfolds.

## Why “Veo”?

“Veo” is Spanish for “I see.” The name reflects what the game asks people to do: pay closer
attention, spot familiar moments in a meeting, and turn them into shared fun through bingo.

> **Status:** The MVP is implemented. It includes the application foundation, data model,
> authentication, teams, secure invitation links, the shared bingo term library, personal
> gameplay, CI/CD, and end-to-end coverage of the core workflow on desktop and mobile.

## Product idea

Veo makes meetings more attentive and entertaining without requiring extra facilitation or
complex role management:

- sign in and join or create a team,
- invite team members with a link,
- add, edit, and delete bingo terms together,
- generate a personal randomized board for each meeting,
- mark matches and detect bingo automatically.

In the MVP, every member of a team has the same permissions.

## Technology stack

| Area                 | Technology                                             |
| -------------------- | ------------------------------------------------------ |
| Full-stack framework | TanStack Start and TanStack Router                     |
| Toolchain            | Vite+ with Vite, Vitest, Oxlint, Oxfmt, and Vite Task  |
| UI                   | React, Tailwind CSS v4, and shadcn/ui                  |
| Design               | Maia, Neutral/Violet, Space Grotesk, Inter, and Lucide |
| Hosting              | Cloudflare Workers                                     |
| Database             | Cloudflare D1 with Drizzle ORM                         |
| Authentication       | Better Auth                                            |
| Observability        | Sentry (errors, sampled traces, metrics, and feedback) |
| End-to-end testing   | Playwright                                             |

Vite+ manages the Node.js runtime, package manager, and frontend toolchain. All dependency
versions are declared in the pnpm catalog in `pnpm-workspace.yaml`; `package.json` exclusively
uses `catalog:` references. The lockfile records the exact resolved versions.

## Prerequisites

- Git
- Vite+ (`vp`)
- Infisical CLI (`infisical`)

Vite+ automatically installs the required Node.js and pnpm versions. See the
[Vite+ documentation](https://viteplus.dev/guide/) for installation instructions.
Install the Infisical CLI using the
[official instructions](https://infisical.com/docs/cli/overview).

## Local development

Local development requires neither Docker nor a Cloudflare login. Wrangler uses Miniflare and
`workerd` to provide a local Workers environment with a D1 binding. Infisical is the sole source
of truth for secrets and injects the `dev` environment directly into the local process.

### First run

```bash
git clone https://github.com/maxstue/veo.git
cd veo
vp install
infisical login
infisical init
vp run db:migrate:local
vp run dev
```

The application is available at `http://localhost:5173` by default. The first migration run
creates the local D1 database exclusively from the versioned SQL files in `migrations/`.

During `infisical init`, select the existing Veo project. Do not copy managed values into a local
`.env`; `vp run dev` fetches them from the Infisical `dev` environment, keeps them in the
child process, and restarts the development server when they change.

Sentry is optional locally and disabled unless `VITE_SENTRY_DSN` is set. Production sampling,
privacy, retention, feedback, product metrics, and verification decisions are documented in the
[Veo Linear project](https://linear.app/justmax/document/observability-und-feedback-6907469d263b).
Secret ownership and the complete local workflow are documented in
[ADR-005](https://linear.app/justmax/document/adr-005-infisical-als-einziges-secret-management-a241e5506ee6).

### Daily workflow

After the first run, the following is usually sufficient:

```bash
vp run dev
```

The local database persists between runs in `.wrangler/`. If the repository contains new
migrations, apply them before starting the development server:

```bash
vp install
vp run db:migrate:local
vp run dev
```

Local and production data are strictly separated. Commands with `--local` operate only on local
Wrangler state; `--remote` accesses the production D1 database after Cloudflare authentication.

### Before committing

```bash
vp run fmt:check
vp run lint
vp check
vp test
vp build
vp run test:e2e
vp run db:check
```

## Common commands

| Command                         | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `vp install`                    | Install dependencies with the pinned pnpm version      |
| `vp run dev`                    | Start development with Infisical `dev` secrets         |
| `vp dev`                        | Start Vite+ directly without secret injection          |
| `vp run fmt`                    | Format supported files in place                        |
| `vp run fmt:check`              | Check formatting without changing files                |
| `vp run lint`                   | Run the configured type-aware linter                   |
| `vp check`                      | Check formatting, linting, and TypeScript together     |
| `vp check --fix`                | Fix supported formatting and linting issues            |
| `vp test`                       | Run Vitest                                             |
| `vp run test:coverage`          | Generate Vitest LCOV coverage for SonarQube Cloud      |
| `vp run test:e2e`               | Run the Playwright MVP workflow on desktop and mobile  |
| `vp run test:e2e:infisical`     | Run Playwright with Infisical `dev` secrets            |
| `vp build`                      | Create the production build for Cloudflare             |
| `vp preview`                    | Preview the production build locally                   |
| `vp run cf:typegen`             | Generate Worker binding types from `wrangler.jsonc`    |
| `vp run db:check`               | Check the consistency of Drizzle migrations            |
| `vp run db:generate`            | Generate a migration after a schema change             |
| `vp run db:migrate:local`       | Apply pending migrations to the local D1 database      |
| `vp run db:migrate:remote`      | Apply pending migrations to the production D1 database |
| `vp run generate-routes`        | Explicitly regenerate TanStack routes                  |
| `vp run deploy`                 | Build and deploy with Wrangler                         |
| `vp run release --ci --dry-run` | Preview the next version, tag, and release notes       |

`vp <command>` runs a built-in Vite+ command. Project-specific scripts from `package.json` run
with `vp run <command>`.

## Project structure

```text
src/
├── components/ui/    shadcn/ui components
├── db/               D1 client and Drizzle schema
├── lib/              shared utilities
├── routes/           file-based TanStack routes
├── router.tsx        router configuration
└── styles.css        global styles and design tokens

components.json       shadcn/ui configuration
drizzle.config.ts     Drizzle Kit configuration
migrations/           versioned D1 SQL migrations
vite.config.ts        Vite+, Vite, Vitest, linting, and formatting
wrangler.jsonc        Cloudflare Workers configuration
pnpm-workspace.yaml   central dependency catalog
worker-configuration.d.ts generated Worker binding types
```

`src/routeTree.gen.ts` is generated by TanStack Router and must not be edited manually.

## Changing the database schema

The Drizzle schema lives in `src/db/schema/`. After changing the schema, generate and inspect a
new migration:

```bash
vp run db:generate
vp run db:check
```

Then apply the migration locally and run the complete verification workflow:

```bash
vp run db:migrate:local
vp check
vp test
vp build
vp run test:e2e
```

Commit generated migrations and Drizzle metadata together with the schema change. Never rewrite
an existing migration after it has been committed.

The schema contains the Better Auth core tables as well as teams, unique memberships,
invitations, team-wide unique bingo terms, and personal cards. Card cells also store the
displayed term as a snapshot. Existing cards therefore remain unchanged when a team later edits
or deletes a source term.

The production D1 ID is declared in `wrangler.jsonc`. Wrangler and the Cloudflare Vite plugin
still create a separate local data store automatically for local commands. Regenerate binding
types after changing Wrangler bindings:

```bash
vp run cf:typegen
```

## Design system

The shadcn/ui configuration is based on preset `b6ReEHaBzU`:

- Maia for soft, spacious component shapes,
- Neutral as the understated base,
- Violet as the primary brand color,
- Space Grotesk for headings,
- Inter for body text,
- Lucide for icons,
- a medium radius for clearly defined bingo cells.

Add new components through Vite+:

```bash
vp dlx -p shadcn@latest -- shadcn add dialog
```

## Brand assets

The Veo mark combines three bingo tiles around a shared center with a coral final marker that
completes the pattern. SVG files in `public/brand/` are the source assets used by the interface,
favicon, and repository. PNG files are generated fallbacks for platform icons, manifests, social
previews, and renderers without SVG support.

## Quality and Git workflow

### TypeScript style

Prefer TypeScript's inferred return types for function implementations. Do not add an explicit
return type when the compiler can infer the same type. Keep explicit return types only when
inference cannot preserve the intended contract, such as for overload or type signatures and type
predicates.

At minimum, run these checks before committing:

```bash
vp run fmt:check
vp run lint
vp check
vp test
vp build
```

Vite+ configures the commit hooks and checks staged files with `vp staged`. Commit messages
follow [Conventional Commits](https://www.conventionalcommits.org/), for example:

```text
feat: add team creation flow
fix: prevent duplicate bingo entries
docs: describe local d1 setup
```

`.gitattributes` enforces LF line endings for text files across the repository.

## SonarQube Cloud

[SonarQube Cloud](https://sonarcloud.io/summary/new_code?id=maxstue_veo) provides automated
code-quality and security analysis. We use the hosted service because it integrates directly
with GitHub and requires no separately operated SonarQube server. The badge at the top of this
README shows the current Quality Gate; implementation and operating details are documented in
[QUEST-48](https://linear.app/justmax/issue/QUEST-48/sonarqube-oder-sonarcloud-integrieren).

### Coverage and test reports

CI creates `coverage/unit/lcov.info` from Vitest. For E2E coverage, Vite instruments the browser
code with Istanbul, Playwright collects `window.__coverage__`, and NYC creates
`coverage/e2e/lcov.info`. SonarQube Cloud imports both reports and combines them for the analyzed
TypeScript sources without a custom coverage-conversion script.

Run both locally with:

```bash
vp run test:coverage
vp run test:e2e:coverage
```

The quality target is at least **80% coverage on new code**. Generated router and environment
typing files and server-only modules are excluded from browser coverage because they are not
maintained client logic. In GitHub Actions, Vitest writes native test annotations and a job
summary, while Playwright writes native failure annotations. The workflow also uploads the Vitest
coverage pages and the Playwright HTML and coverage reports as artifacts for 14 days. CI needs a
repository Actions secret named
`SONAR_TOKEN` to publish the analysis. Pull requests from forks still run tests but skip publishing
because GitHub does not expose repository secrets to them.

## Pull request checks

The `.github/workflows/pull-request.yml` workflow is the required quality gate for pull requests
against `main`. It runs formatting, linting, type checks, unit tests with coverage, the production
build, end-to-end tests with coverage, and SonarQube Cloud analysis. Pull requests from forks run
the same checks but skip SonarQube publishing because GitHub does not expose repository secrets to
them. Configure the `Quality` job as a required status check in the `main` branch ruleset and
disallow direct pushes so unverified code cannot enter the release path.

## Deployment and releases

The `.github/workflows/release.yml` workflow runs only after a push to `main`. It first classifies
the changed files:

- deployable application, runtime, build, or dependency changes trigger a production deployment;
- changes below `migrations/` apply pending D1 migrations before deployment;
- documentation, test-only, and GitHub workflow changes trigger neither deployment nor release.

If a required migration fails, deployment stops. After a successful Cloudflare deployment,
`release-it` creates the release in the same workflow. Veo uses calendar versions in
`YYYY.MM.N` format. The package version, annotated `v<version>` Git tag, generated changelog, and
GitHub Release notes are produced together and therefore stay aligned. A Git note under
`refs/notes/cloudflare-releases` records the deployed source commit and prevents a workflow rerun
from publishing it twice. The generated release commit contains `[skip ci]` so it does not start a
second release workflow.

Preview the next version and release notes locally without committing, tagging, pushing, or
publishing anything:

```bash
vp run release --ci --dry-run --no-git.requireCleanWorkingDir
```

The production workflow is serialized so two deployments cannot migrate or publish concurrently.

Only these secrets are synchronized from Infisical into the `production` GitHub environment:

- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID,
- `CLOUDFLARE_API_TOKEN`: a token restricted to the Veo account with `Workers Scripts: Edit` and
  `D1: Edit` permissions.

Configure the desired deployment protection rules on the GitHub environment before the first
release. The workflow's default permission is read-only; only the final release job receives
`contents: write` and uses GitHub's short-lived `GITHUB_TOKEN`. No separate release credential is
required.

The runtime values `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, and `SENTRY_DSN` are managed only in
Infisical and synchronized directly to Cloudflare Worker Secrets. Rotate values in Infisical,
then verify the relevant GitHub or Cloudflare sync; do not maintain separate copies manually.
The ownership model and operating workflow are documented in
[ADR-005](https://linear.app/justmax/document/adr-005-infisical-als-einziges-secret-management-a241e5506ee6).

The Worker is configured with `workers_dev` disabled. Configure the production route or custom
domain in Cloudflare before deployment, and ensure the API token and account can access the
associated zone.

## Roadmap

The MVP comprised these completed phases:

1. Foundation and design
2. D1 and Drizzle data foundation
3. Better Auth and protected routes
4. Teams and invitations
5. Shared bingo term management
6. Personal gameplay
7. GitHub Actions and Cloudflare deployment
8. Playwright coverage and MVP polish

Post-MVP planning, architecture decisions, and implementation issues are maintained in the
**Veo** Linear project by the **Quests** team.
