# Sicherheitsupdates für Abhängigkeiten

Status: Implementiert; PR ausstehend
Datum: 2026-09-30

## Ziel

Alle aktiven GitHub-Dependabot-Alerts sowie aus `npm audit` lösbare Advisories
sollen mit kompatiblen, gepatchten Abhängigkeiten behoben werden. Es werden
keine Major-Downgrades oder ungeprüften Force-Fixes verwendet.

## Betroffene Pakete

- `moment` mindestens `2.31.0` (Runtime-Abhängigkeit)
- `serialize-javascript` mindestens `7.1.2`
- `brace-expansion` mindestens `5.0.12`
- `@module-federation/dts-plugin` mindestens `2.9.2`, damit `adm-zip >=0.6.1`
  und `undici >=7.29.1` aufgelöst werden
- `esbuild` mindestens `0.25.0` für `@alcalzone/esbuild-register`, sofern das
  Override mit aktuellem `@iobroker/testing` kompatibel bleibt

## Akzeptanzkriterien

- `npm audit` meldet keine bekannten Schwachstellen.
- Lockfile enthält keine verwundbaren Versionen der betroffenen Pakete.
- Unit-, Admin-, Lint-, Admin-Build- und js-controller-E2E-Tests bestehen.
- Veraltete Dependabot-PRs, die durch diesen Patch ersetzt werden, werden
  geschlossen und auf den konsolidierten PR verwiesen.
- Release erfolgt nach Merge des PRs nach `master` gemäß Release-Workflow.

## Nicht-Ziele

- Kein `npm audit fix --force`.
- Keine Versionsänderung an unbetroffenen direkten Abhängigkeiten.
- Keine automatische Installation einer nicht kompatiblen js-controller- oder
  Adapter-Testframework-Major-Version.
