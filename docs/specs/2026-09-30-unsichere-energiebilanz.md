# Unsichere Energiebilanz bei unvollständigen Leistungsdaten

Status: Implementiert
Datum: 2026-09-30

## Ziel

Eine Energiebilanz darf aus einer lückenhaften oder abgeschnittenen
Leistungshistorie keine belastbare Residualabweichung berechnen. Der betroffene
Tag soll als unsicher bzw. mit Datenlücken gemeldet werden.

## Vertrag

- `computePeriodEnergy` mit `quality` ungleich `complete` darf nicht in einen
  numerischen Tagesresidual eingehen.
- Unvollständige Baseline-Tage werden aus der Vergleichsbasis ausgeschlossen.
- Ist der aktuelle Tag unvollständig, wird `currentValue: null` und
  `dataCompleteness: gaps` an die Anomalieerkennung übergeben. Diese meldet —
  sofern genügend vollständige Baseline-Tage existieren — `missing_data`, nicht
  `energy_balance_deviation`.
- Reset-/Qualitätsunsicherheit der Zähler wird nach derselben Fail-closed-Regel
  behandelt.
- Die Meldung enthält Quellenrolle(n) mit Datenlücken/Unsicherheit; ein
  Teilresidual wird nicht als Bilanzwert ausgegeben.

## Nicht-Ziele

- Keine Interpolation oder Hochrechnung fehlender Leistungspunkte.
- Keine Änderung der 15-Minuten-Lückenschwelle.
- Keine Änderung der statistischen Schwellenwerte.
