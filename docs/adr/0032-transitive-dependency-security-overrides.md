# ADR-0032: Eng begrenzte Overrides für verwundbare transitive Abhängigkeiten

**Status:** Angenommen
**Datum:** 2026-09-30

## Kontext

Aktive Dependabot-Alerts betreffen mehrere transitive Runtime- und
Build-/Test-Abhängigkeiten. Ein globales `npm audit fix --force` würde für
`@iobroker/testing` eine nicht kompatible Major-Downgrade-Empfehlung ausgeben.
`@module-federation/vite` pinnt den von Security-Advisories betroffenen
TypeScript-Definitions-Plugin-Pfad auf eine ältere Version.

## Entscheidung

Gepatchte, kompatible Paketversionen werden bevorzugt über Lockfile-Updates
aktualisiert. `overrides` werden nur für konkret betroffene transitive
Abhängigkeiten gesetzt und müssen Unit-, Admin-, Build- und E2E-Prüfungen
bestehen. `esbuild` wird auf eine gepatchte exakte Version festgesetzt, weil
npm 10 sonst beim `npm ci` den Lockfile-Eintrag nicht reproduziert. Das Override
muss entfernt oder angepasst werden, sobald der abhängige E2E-Registrierer eine
gepatchte Mindestversion deklariert.

## Konsequenzen

- Bekannte Schwachstellen können behoben werden, ohne das Testframework
  herunterzustufen.
- Overrides erhöhen Wartungsaufwand und müssen bei Upstream-Updates erneut
  bewertet und möglichst entfernt werden.
