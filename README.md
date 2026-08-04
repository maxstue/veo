# Veo

Veo ist ein gemeinsam gepflegtes Bingo für Dailys, Reviews und andere Team-Meetings.
Teammitglieder sammeln typische Aussagen und Situationen, erhalten ein persönliches Board
und markieren Treffer während des Meetings.

> **Status:** Frühe Entwicklung. Projektgrundgerüst, D1-/Drizzle-Datengrundlage und
> Better-Auth-Anmeldung stehen; Teams und sichere Einladungslinks werden aktuell umgesetzt.

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
| Datenbank           | Cloudflare D1 mit Drizzle ORM                         |
| Anmeldung           | Better Auth                                           |
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

Für die lokale Entwicklung werden weder Docker noch ein Cloudflare-Login benötigt. Wrangler
stellt über Miniflare und `workerd` eine lokale Worker-Umgebung samt D1-Bindung bereit.

### Erster Start

```bash
git clone https://github.com/maxstue/veo.git
cd veo
vp install
vp run db:migrate:local
vp dev
```

Die Anwendung ist anschließend standardmäßig unter `http://localhost:5173` erreichbar. Der
erste Migrationslauf erzeugt die lokale D1 allein aus den versionierten SQL-Dateien unter
`migrations/`.

Für die lokale Anmeldung wird zusätzlich ein Secret benötigt. Kopiere `.env.example` nach `.env`
und ersetze den Platzhalter durch einen zufälligen Wert mit mindestens 32 Zeichen.
Die Datei ist ignoriert und darf nicht committed werden. In Produktion wird derselbe Binding-Name
ausschließlich als Cloudflare Worker Secret gesetzt:

```bash
vp exec wrangler secret put BETTER_AUTH_SECRET
```

### Täglicher Ablauf

Nach dem ersten Start genügt normalerweise:

```bash
vp dev
```

Die lokale Datenbank bleibt zwischen den Starts unter `.wrangler/` erhalten. Wenn neue
Migrationen aus dem Repository hinzugekommen sind, werden sie vor dem Start angewendet:

```bash
vp install
vp run db:migrate:local
vp dev
```

Lokale und produktive Daten sind strikt getrennt. Befehle mit `--local` verwenden nur den
lokalen Wrangler-Zustand; erst `--remote` greift nach einer Cloudflare-Anmeldung auf die
produktive D1 zu.

### Vor einem Commit

```bash
vp check
vp test
vp build
vp run db:check
```

## Wichtige Befehle

| Befehl                     | Zweck                                                         |
| -------------------------- | ------------------------------------------------------------- |
| `vp install`               | Abhängigkeiten mit der festgelegten pnpm-Version installieren |
| `vp dev`                   | Entwicklungsserver starten                                    |
| `vp check`                 | Formatierung, Linting und TypeScript gemeinsam prüfen         |
| `vp check --fix`           | Behebbare Formatierungs- und Lint-Probleme korrigieren        |
| `vp test`                  | Vitest ausführen                                              |
| `vp build`                 | Produktions-Build für Cloudflare erzeugen                     |
| `vp preview`               | Produktions-Build lokal anzeigen                              |
| `vp run cf:typegen`        | Worker-Bindings aus `wrangler.jsonc` typisieren               |
| `vp run db:check`          | Konsistenz der Drizzle-Migrationen prüfen                     |
| `vp run db:generate`       | Migration nach einer Schemaänderung erzeugen                  |
| `vp run db:migrate:local`  | Ausstehende Migrationen auf die lokale D1 anwenden            |
| `vp run db:migrate:remote` | Ausstehende Migrationen auf die produktive D1 anwenden        |
| `vp run generate-routes`   | TanStack-Routen explizit neu generieren                       |
| `vp run deploy`            | Build erstellen und mit Wrangler deployen                     |

`vp <befehl>` startet einen eingebauten Vite+-Befehl. Projektspezifische Skripte aus
`package.json` werden mit `vp run <befehl>` ausgeführt.

## Projektstruktur

```text
src/
├── components/ui/    shadcn/ui-Komponenten
├── db/               D1-Client und Drizzle-Schema
├── lib/              gemeinsame Hilfsfunktionen
├── routes/           dateibasierte TanStack-Routen
├── router.tsx        Router-Konfiguration
└── styles.css        globale Styles und Design-Tokens

components.json       shadcn/ui-Konfiguration
drizzle.config.ts     Drizzle-Kit-Konfiguration
migrations/           versionierte D1-SQL-Migrationen
vite.config.ts        Vite+, Vite, Vitest, Linting und Formatting
wrangler.jsonc        Cloudflare-Workers-Konfiguration
pnpm-workspace.yaml   zentraler Dependency-Catalog
worker-configuration.d.ts generierte Typen für Worker-Bindings
```

`src/routeTree.gen.ts` wird von TanStack Router generiert und nicht manuell bearbeitet.

## Datenbankschema ändern

Das Drizzle-Schema liegt unter `src/db/schema/`. Nach einer Schemaänderung wird zuerst eine neue
Migration erzeugt und kontrolliert:

```bash
vp run db:generate
vp run db:check
```

Anschließend wird die neue Migration lokal angewendet und der vollständige Prüfablauf ausgeführt:

```bash
vp run db:migrate:local
vp check
vp test
vp build
```

Erzeugte Migrationen und Drizzle-Metadaten werden gemeinsam mit der Schemaänderung committed.
Bestehende Migrationen werden nachträglich nicht umgeschrieben.

Das Schema enthält die Better-Auth-Kerntabellen sowie Teams, eindeutige Mitgliedschaften,
Einladungen, teamweit eindeutige Bingo-Begriffe und persönliche Karten. Kartenfelder speichern
den angezeigten Begriff zusätzlich als Snapshot. Dadurch bleiben bestehende Karten unverändert,
wenn ein Team einen Quellbegriff später bearbeitet oder löscht.

Die produktive D1-ID ist in `wrangler.jsonc` eingetragen. Trotzdem erzeugen Wrangler und das
Cloudflare-Vite-Plugin bei lokalen Befehlen automatisch einen getrennten lokalen Datenbestand.
Nach einer Änderung der Wrangler-Bindings werden ihre Typen neu erzeugt:

```bash
vp run cf:typegen
```

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

1. Better-Auth-Secrets,
2. GitHub-Actions-Workflow,
3. Verbindung der Domain `veo.justmax.xyz`.

Bis diese Infrastruktur eingerichtet ist, führt `vp run deploy` nur mit einer lokal
authentifizierten Wrangler-Session zu einem erfolgreichen Deployment.

## Roadmap

1. Better Auth und geschützte Routen einrichten
2. Teams und Einladungen implementieren
3. Bingo-Begriffe gemeinsam verwalten
4. persönlichen Spielablauf umsetzen
5. GitHub Actions und Cloudflare-Deployment ergänzen
6. Playwright-Tests und MVP-Polish abschließen

Planung, Architekturentscheidungen und Umsetzungstickets werden im Linear-Projekt **Veo** im
Team **Quests** gepflegt.
