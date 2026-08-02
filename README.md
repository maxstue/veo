# Veo

Veo ist ein gemeinsam gepflegtes Bingo für Dailys, Reviews und andere Team-Meetings.
Teammitglieder sammeln typische Aussagen und Situationen, erhalten ein persönliches Board
und markieren Treffer während des Meetings.

> **Status:** Frühe Entwicklung. Das Projektgrundgerüst und die erste Oberfläche stehen;
> Authentifizierung, Teams, Einladungen und der eigentliche Spielablauf folgen schrittweise.

## Produktidee

Veo soll Meetings aufmerksamer und unterhaltsamer machen, ohne zusätzliche Moderation oder
komplizierte Rollenverwaltung:

- anmelden und einem Team beitreten oder ein Team erstellen,
- Teammitglieder über einen Link einladen,
- Bingo-Begriffe gemeinsam hinzufügen, bearbeiten und löschen,
- für jedes Meeting ein persönliches, zufälliges Board erzeugen,
- Treffer markieren und Bingo automatisch erkennen.

Im ersten MVP haben alle Mitglieder eines Teams dieselben Rechte.

## Technischer Stack

| Bereich             | Technologie                                           |
| ------------------- | ----------------------------------------------------- |
| Fullstack-Framework | TanStack Start und TanStack Router                    |
| Toolchain           | Vite+ mit Vite, Vitest, Oxlint, Oxfmt und Vite Task   |
| UI                  | React, Tailwind CSS v4 und shadcn/ui                  |
| Design              | Maia, Neutral/Violet, Space Grotesk, Inter und Lucide |
| Hosting             | Cloudflare Workers                                    |
| Datenbank           | Cloudflare D1 mit Drizzle (geplant)                   |
| Anmeldung           | Better Auth (geplant)                                 |
| End-to-End-Tests    | Playwright (geplant)                                  |

Vite+ verwaltet die Node.js-Laufzeit, den Package Manager und die Frontend-Toolchain. Alle
Dependency-Versionen stehen im pnpm-Catalog in `pnpm-workspace.yaml`; `package.json` verwendet
ausschließlich `catalog:`. Das Lockfile hält die tatsächlich aufgelösten Versionen fest.

## Voraussetzungen

- Git
- Vite+ (`vp`)

Vite+ installiert die passende Node.js- und pnpm-Version automatisch. Hinweise zur Installation
stehen in der [Vite+-Dokumentation](https://viteplus.dev/guide/).

## Lokale Entwicklung

```bash
git clone https://github.com/maxstue/veo.git
cd veo
vp install
vp dev
```

Die Anwendung ist anschließend standardmäßig unter `http://localhost:5173` erreichbar.

## Wichtige Befehle

| Befehl                   | Zweck                                                         |
| ------------------------ | ------------------------------------------------------------- |
| `vp install`             | Abhängigkeiten mit der festgelegten pnpm-Version installieren |
| `vp dev`                 | Entwicklungsserver starten                                    |
| `vp check`               | Formatierung, Linting und TypeScript gemeinsam prüfen         |
| `vp check --fix`         | Behebbare Formatierungs- und Lint-Probleme korrigieren        |
| `vp test`                | Vitest ausführen                                              |
| `vp build`               | Produktions-Build für Cloudflare erzeugen                     |
| `vp preview`             | Produktions-Build lokal anzeigen                              |
| `vp run generate-routes` | TanStack-Routen explizit neu generieren                       |
| `vp run deploy`          | Build erstellen und mit Wrangler deployen                     |

`vp <befehl>` startet einen eingebauten Vite+-Befehl. Projektspezifische Skripte aus
`package.json` werden mit `vp run <befehl>` ausgeführt.

## Projektstruktur

```text
src/
├── components/ui/    shadcn/ui-Komponenten
├── lib/              gemeinsame Hilfsfunktionen
├── routes/           dateibasierte TanStack-Routen
├── router.tsx        Router-Konfiguration
└── styles.css        globale Styles und Design-Tokens

components.json       shadcn/ui-Konfiguration
vite.config.ts        Vite+, Vite, Vitest, Linting und Formatting
wrangler.jsonc        Cloudflare-Workers-Konfiguration
pnpm-workspace.yaml   zentraler Dependency-Catalog
```

`src/routeTree.gen.ts` wird von TanStack Router generiert und nicht manuell bearbeitet.

## Designsystem

Die shadcn/ui-Konfiguration basiert auf dem Preset `b6ReEHaBzU`:

- Maia als weiche, großzügige Komponentenform,
- Neutral als ruhige Basis,
- Violet als primäre Markenfarbe,
- Space Grotesk für Überschriften,
- Inter für Fließtext,
- Lucide für Icons,
- mittlerer Radius für klar erkennbare Bingo-Felder.

Neue Komponenten werden über Vite+ hinzugefügt:

```bash
vp dlx -p shadcn@latest -- shadcn add dialog
```

## Qualität und Git-Workflow

Vor einem Commit sollten mindestens diese Prüfungen erfolgreich sein:

```bash
vp check
vp test
vp build
```

Vite+ richtet die Commit Hooks ein und prüft gestagte Dateien mit `vp staged`. Commit-Nachrichten
folgen [Conventional Commits](https://www.conventionalcommits.org/), zum Beispiel:

```text
feat: add team creation flow
fix: prevent duplicate bingo entries
docs: describe local d1 setup
```

Textdateien werden über `.gitattributes` repositoryweit mit LF gespeichert.

## Deployment

Der Cloudflare-Adapter ist eingerichtet und `vp build` erzeugt Client- und Worker-Artefakte.
Für ein produktives Deployment fehlen derzeit noch:

1. Cloudflare-D1-Datenbank und Bindings,
2. Better-Auth-Secrets,
3. GitHub-Actions-Workflow,
4. Verbindung der Domain `veo.justmax.xyz`.

Bis diese Infrastruktur eingerichtet ist, führt `vp run deploy` nur mit einer lokal
authentifizierten Wrangler-Session zu einem erfolgreichen Deployment.

## Roadmap

1. D1 und Drizzle integrieren
2. Better Auth und geschützte Routen einrichten
3. Teams und Einladungen implementieren
4. Bingo-Begriffe gemeinsam verwalten
5. persönlichen Spielablauf umsetzen
6. Playwright und GitHub Actions ergänzen

Planung, Architekturentscheidungen und Umsetzungstickets werden im Linear-Projekt **Veo** im
Team **Quests** gepflegt.
