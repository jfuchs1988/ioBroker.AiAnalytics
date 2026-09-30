# Unplausible Sprünge in kumulativen Zählern

Status: Implementiert
Datum: 2026-09-30

## Ziel

Kumulative Zähler dürfen positive Ausreißer nicht stillschweigend als echte
Energie verbuchen. Verdächtige Zunahmen werden ausgelassen und die
Periodenqualität wird als `uncertain` markiert.

## Erkennung und Konfiguration

- Ein Katalogeintrag kann optional `maxPlausibleKwhPerHour` speichern. Der Wert
  ist ein positiver Grenzwert für Energiezähler in kWh/h und wird manuell pro
  Datenpunkt gepflegt.
- Für mindestens vier gültige historische Differenzen wird zusätzlich ein
  robuster Rate-Ausreißer erkannt, wenn die neue Rate größer als `max(1 kWh/h,
  10 * medianRate, medianRate + 8 * MAD)` ist. Das erkennt nur extreme Sprünge
  und ersetzt keine technische Leistungsgrenze.
- Wenn ein konfigurierte Grenzwert existiert, ist die maximale Differenz
  `maxPlausibleKwhPerHour * elapsedHours`.
- Überschrittene Differenzen werden nicht addiert, als `outlier` samt Zeitpunkt
  ausgewiesen und machen die Periode unsicher.
- Rücksetzungen bleiben separat erkennbar und werden nicht als positiver
  Ausreißer behandelt.

## Ergebnis

`cumulative_total` liefert weiter `total`, `quality`, `resets` und zusätzlich
`outliers`. Werkzeugausgaben nennen den optional verwendeten Grenzwert.
Unsichere Perioden werden von der Energiebilanz fail-closed ausgeschlossen.

## Nicht-Ziele

- Keine automatische Einheit- oder Anlagenleistungsableitung aus Namen.
- Keine künstliche Korrektur eines Ausreißers auf einen angenommenen Wert.
- Keine generelle Ablehnung großer Differenzen, wenn weder robuste Historie
  noch manuell bestätigter Grenzwert vorhanden ist.
