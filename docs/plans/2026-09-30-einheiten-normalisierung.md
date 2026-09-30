# Plan: Einheitenprüfung und Normalisierung

Status: Abgeschlossen

1. Spec mit dem bestehenden Katalog- und Energiebilanzvertrag abgleichen.
2. TDD-Tests für `Wh`/`kWh`, `W`/`kW`, fehlende und unbekannte Einheiten sowie
   Ergebnis-Metadaten ergänzen.
3. Eine kleine reine Normalisierungsfunktion für kanonische Einheit, Faktor
   und Rollenfamilie erstellen.
4. Werte vor Maximum- und Differenzberechnung normalisieren.
5. `sourceUnit`, `normalizedUnit` und `conversionFactor` in Werkzeugergebnissen
   ausgeben, ohne die Katalogeinheit zu überschreiben.
6. Nur validierte, auf `kWh` normalisierte Pflichtrollen in die Energiebilanz
   aufnehmen.
7. Den Prompt um die Pflicht zur Einheitenangabe und das Nicht-Raten ergänzen.
8. Fachtests, vollständige Tests und Lint ausführen; anschließend Live-Abnahme
   zusammen mit Punkt 1.

## Voraussichtlich betroffene Dateien

- `lib/unitNormalization.js` (neu)
- `lib/periodValue.js`
- `lib/tools.js`
- `lib/energyBalance.js`
- `main.js`
- `test/unit/unitNormalization.test.js` (neu)
- `test/unit/periodValue.test.js`
- `test/unit/tools.test.js`
