# Plan: ioBroker-Zeitzone

Status: Abgeschlossen

1. Tests für explizite Zone, optionale `system.config.common.timeZone`, Host-
   Fallback, ungültige Quellen und Konfliktwarnungen schreiben.
2. Resolver für effektive Zeitzone und Diagnosemetadaten implementieren.
3. Adapterkonfiguration, Default in `io-package.json` und Admin-Einstellung
   `timeZone` ergänzen.
4. Effektive Zone samt Quellen/Warnungen in `info.timeZone` persistieren und
   bei Konflikten im Adapterlog melden.
5. Alle lokalen Perioden-/Tagesfunktionen und Prompt-Kontext auf dieselbe
   effektive Zone umstellen.
6. Dokumentieren, dass UTC-History-Zeitstempel selbst keine lokale Zone
   enthalten und daher kein automatischer Datenbankzonenabgleich möglich ist.
7. Vollständige Tests, Admin-Build und Lint ausführen.
