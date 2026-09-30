# Plan: Sichere Leistungsintegration

Status: Abgeschlossen (Live-Abnahme übersprungen auf Nutzerwunsch)

1. Integrationsfunktion als reine Einheit mit Tests für Vorzeichen, Trapezregel,
   Lücken, Resets und abgeschnittene Rohdaten spezifizieren.
2. Rohdatenabruf für Integrationszeiträume explizit begrenzen; bei Truncation
   nicht stillschweigend fortfahren.
3. `grid_power` und `battery_power` getrennt in positive/negative Energieflüsse
   integrieren.
4. Ergebnis in `getPeriodTotal` bzw. einem dedizierten Energie-Werkzeug mit
   Qualitäts- und Abdeckungsmetadaten verfügbar machen.
5. Bilanzlogik nur nach expliziter Vollständigkeitsprüfung für integrierte
   Rollen öffnen; Zählerpfad unverändert lassen.
6. Systemprompt um Vorzeichen-, Lücken- und Qualitätsregeln ergänzen.
7. Fachtests, vollständige Tests und Lint ausführen; danach Live-Abnahme gegen
   eine bekannte Leistungsreihe.

## Voraussichtlich betroffene Dateien

- `lib/powerIntegration.js` (neu)
- `lib/dataAccess.js`
- `lib/tools.js`
- `lib/energyBalance.js`
- `main.js`
- `test/unit/powerIntegration.test.js` (neu)
- `test/unit/tools.test.js`
- `test/unit/energyBalance.test.js`
