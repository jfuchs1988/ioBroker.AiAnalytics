# Plan: Dependency-Sicherheitsupdates

Status: Verifiziert; PR und Release folgen

1. Verwundbare transitive Pfade aus Dependabot und `npm audit` verifizieren.
2. Gepatchte Patch-/Minor-Versionen im Lockfile aktualisieren; nötige Overrides
   eng auf den verwundbaren Parent begrenzen.
3. Tests für Lockfile-/Release-Metadaten und vorhandene Integrationsverträge
   ausführen.
4. `npm audit`, Unit-/Admin-Tests, Lint, Admin-Build und E2E ausführen.
5. Einen konsolidierten Security-PR nach `master` erstellen; ersetzte
   Dependabot-PRs schließen.
6. Nach PR-Merge Release mit Versions-/Changelog-Metadaten, Paket, Tag und
   GitHub-Release erstellen.
