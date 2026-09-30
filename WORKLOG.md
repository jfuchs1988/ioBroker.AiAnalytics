# Arbeitsstand

Kurzer Übergabestand für die nächste Sitzung. Abgeschlossene Historie steht in
`CHANGELOG.md` und Git, dauerhafte Risiken in
`docs/architecture/11-risiken-und-schulden.md`.

## WIP

- **Pause 2026-09-30 — Branch `feature/timezone-counter-quality`:**
  `develop` enthält die gemergten Fixes bis einschließlich
  `c06d959 merge: uncertain energy balance handling into develop`. Die Punkte
  1 und 2 der vorherigen Runde sind abgeschlossen: unsichere Energiebilanzen
  werden fail-closed gemeldet; `qualityReasons` und `missing_data` werden
  ausgegeben. Der Arbeitsbaum enthält nun uncommittete Vorarbeiten für die
  nächsten Punkte:
  - kumulative Zähler: `maxPlausibleKwhPerHour`, robuste Rate-Ausreißer,
    `outliers` und `quality: uncertain`;
  - Zeitzone: Spec/Plan/ADR, IANA-Resolver mit Adapter-Override,
    `system.config.common.timeZone` und Host-Fallback, Konfliktwarnungen,
    `info.timeZone`-Diagnose-State und `admin/jsonConfig.json`-Feld;
  - Admin-/CSV-Feld für den plausiblen Zähleranstieg;
  - lokale Perioden verwenden den Adapter-Zeitzonen-Override in Tools,
    Energiebilanz, Anomalie- und HVAC-Korrelation.
  Tests nach dem bisherigen Zwischenstand: `npm run test:unit` **536** grün,
  `npm run test:admin` **60** grün, `npm run lint` grün; `git diff --check`
  grün. Bei Wiederaufnahme alle Verifikationen erneut ausführen.
  **Noch offen:** Release-Metadaten/Changelog, Commit und Merge dieses Branches nach
  `develop`. Danach PR von `develop` nach `master`; erst nach PR-Merge Release
  (Version bump, Changelog/io-package, Build, Tag, GitHub Release).
  Live-Test bleibt übersprungen, wie vom Nutzer angewiesen.

- `fix/uncertain-energy-balance`: Bilanzresiduals mit unsicherer Leistungs- oder
  Zählerhistorie werden verworfen, unvollständige Baseline-Tage ausgeschlossen
  und Datenlücken mit betroffenen Rollen markiert. `npm test` (530 Unit-/60
  Admin-Tests) und `npm run lint` erfolgreich. Nächster Schritt: Review/Merge.
- Live-Testlauf am 30.09.2026 fortgesetzt: drei getrennte KI-Abfragen zu PV-
  Tageszählern, PV-Leistungsdaten und Heizungsdaten jeweils gegen unabhängige
  InfluxDB-Referenzabfragen geprüft. Heizungswerte stimmten praktisch mit der
  DB überein; PV-Tageszähler lagen innerhalb ca. 0,3 % der DB-Maxima. Eine
  zunächst abweichende PV-Leistung wurde durch eine fokussierte Wiederholung
  mit exakt vorgegebenen sourceIds aufgelöst: beide Punkte lieferten denselben
  Mittelwert und dasselbe Maximum. Keine Chat-Fehler oder Timeouts sichtbar.
  Zusätzlich wurde ein Gleitkomma-Artefakt in der Einheiten-Normalisierung
  behoben und die betroffenen Fixtures um Einheiten ergänzt. Verifikation:
  `npm test` grün (519 Unit-/60 Admin-Tests), Lint grün. Nächster Schritt:
  weitere Analoggruppen (Batterie/Netzbezug) mit demselben Ablauf prüfen.

- Fix `fix/robust-energy-periods`: Tageszähler werden bei verspätetem Reset
  segmentiert, kumulative Zähler liefern Reset-/Qualitätsmetadaten und lokale
  `dayOffset`-Tage werden DST-sicher kalenderbasiert verschoben. Fachtests
  grün; `npm test` (514 Unit-/60 Admin-Tests), `npm run lint` und
  `git diff --check` erfolgreich. Keine Admin-Quellen geändert, daher kein
  Admin-Build erforderlich. Nächster Schritt: Review/PR.
- Nächster SpecKit-Schritt: Einheitenprüfung und Normalisierung in
  `docs/specs/2026-09-30-einheiten-normalisierung.md` und
  `docs/plans/2026-09-30-einheiten-normalisierung.md`; implementiert und
  getestet. `npm test` (520 Unit-/60 Admin-Tests) und `npm run lint` grün.
- Live-Test gegen die lokale ioBroker-Admin-Oberfläche und InfluxDB über
  Chrome-CDP dokumentiert in `docs/agents/live-history-testing.md`. Dabei wurde
  eine bestätigte PV-/Netzeinspeisegruppe gesetzt und `getSelfConsumption`
  direkt gegen ioBroker-History verifiziert. Nächster Schritt: nach PR-Merge
  bei Bedarf die Verbrauchszähler-/Energiebilanzrollen fachlich klären.
- Feature-Branch `feature/diagnostic-github-report`: Variante A für
  Fehlerberichte ist implementiert. Der Admin-Tab sammelt redigierte
  Diagnosedaten; jede Assistentenantwort im Chat hat zusätzlich einen eigenen
  Fehler-melden-Button, der Frage und Antwort redigiert in die Vorschau
  übernimmt. Der Tab öffnet einen vorausgefüllten GitHub-Bugreport; automatische
  Veröffentlichung und GitHub-Tokens sind nicht enthalten. Tests: `npm test`
  grün. Nächster Schritt: PR-Review und danach Live-Test nach Installation des
  neuen Adapterpakets.
- Release `v0.1.13` ist veröffentlicht: PR #52 (Fix) und PR #53 (Release)
  wurden gemergt, Tag und GitHub-Release sind vorhanden. Keine offenen Pull
  Requests.
- Ursache für "Aktivierung starten" schlägt fehl / keine AI-Calls möglich
  (Live-Debugging über Claude in Chrome auf der echten Admin-UI):
  zwei unabhängige Fehler im Lizenz-/Entitlement-Pfad, die beide dieselben
  Symptome erzeugten, weil ohne gespeichertes Entitlement-Token
  `canUseChat()` in `lib/license.js` jede Chat-/AI-Anfrage blockiert —
  unabhängig von einer korrekt konfigurierten AI-Provider-Verbindung.
  1. Der geteilte Provider-Timeout (30 s, `lib/providers/request.js`) reichte
     nicht für einen Kaltstart des Lizenz-Backends
     (`https://iob-ai-analytics.jfuchs.de`); Admin-Log zeigte exakt
     `Provider request timed out after 30000 ms.`. Fix: eigener 60-s-Timeout
     nur für Lizenz-Backend-Requests in `lib/licenseBackend.js`
     (`LICENSE_REQUEST_TIMEOUT_MS`), AI-Provider-Timeout unverändert.
  2. Nach einem Backend-Redeploy/DB-Neuanlage passte der in `main.js`
     hinterlegte Ed25519-Public-Key (`kid: prod-1`) nicht mehr zum privaten
     Signierschlüssel im produktiven Key Vault
     (`jf-iob-ai-analytics-kv/entitlement-signing-key`) — jede Aktivierung
     endete mit `Lizenzdienst lieferte ein ungueltig signiertes Entitlement.`
     Der korrekte Public Key wurde aus dem Key-Vault-Secret abgeleitet (nur
     lesend, privater Schlüssel nie ausgegeben) und end-to-end gegen ein
     echtes, frisch ausgestelltes Entitlement verifiziert
     (`evaluateLicense()` → `status: active, fullAccess: true`). `main.js`
     aktualisiert.
- Verifikation: `npm test` (506 Unit-/60 Admin-Tests), Lint,
  Release-Metadatenprüfung, Paketbau und echter E2E-Test (2 Tests) erfolgreich.
  Live-Aktivierung im Admin-UI danach erfolgreich abgeschlossen (Token
  gespeichert).
- Lehre für künftige Releases: nach jedem Versionsbump `npm test` erneut
  laufen lassen, nicht nur `check:release`/`pack:release`/`test:e2e` — der
  Dokumentationstest `keeps package versions synchronized` prüft auch
  `package-lock.json` und schlug im ersten CI-Lauf von PR #53 fehl, weil das
  Lockfile nicht mit `npm install --package-lock-only` nachgezogen war.
- Offen (siehe Nächste Schritte): Backend-seitiger Key-Rotation-Prozess für
  `entitlement-signing-key`, damit ein künftiger Secret-Wechsel nicht erneut
  unbemerkt bleibt.
- Offene externe Aufgabe: Veröffentlichung bzw. Abstimmung mit der offiziellen
  ioBroker-Adapter-Liste; danach offizieller Adapter-Checker erneut ausführen.
- GitHub meldet weiterhin transitive Entwicklungs-Alerts für
  `adm-zip`/`undici`/`esbuild`. Ein erzwungenes Audit-Downgrade würde
  inkompatible Versionen einführen und wurde nicht angewendet.

## Nächste Schritte

- Offizielle ioBroker-Adapterliste und `adapter-check.iobroker.in` prüfen.
- Dependency-Alerts bei passenden kompatiblen Upstream-Releases erneut bewerten.
- Backend-seitig pruefen, ob/warum der Key-Vault-Secret-Inhalt fuer
  `entitlement-signing-key` sich geaendert hat (Redeploy/DB-Neuanlage), und ob
  ein dokumentierter Key-Rotation-Prozess (neue `kid`) noetig ist, damit dies
  nicht erneut unbemerkt passiert.
