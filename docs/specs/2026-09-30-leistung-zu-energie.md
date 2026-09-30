# Sichere Leistungsintegration

Status: Implementiert
Datum: 2026-09-30

## Ziel

Signierte Momentanleistungen in `W`/`kW` sollen optional in Energieflüsse in
`kWh` umgerechnet werden können, ohne fehlende Messwerte über große Zeiträume
zu interpolieren oder Erzeugung und Bezug durch Vorzeichen zu vermischen.

## Geltungsbereich

Die Integration gilt ausschließlich für katalogisierte Rollen `grid_power` und
`battery_power`. Sie ist zunächst eine typbewusste Periodenauswertung und darf
nicht automatisch eine bisherige Zählerrolle ersetzen.

## Berechnung

- Rohwerte werden chronologisch gelesen und auf `kW` normalisiert.
- Zwischen zwei Punkten wird trapezförmig integriert.
- Intervalle mit mehr als 15 Minuten Abstand werden nicht integriert und als
  Datenlücke ausgewiesen.
- Bei `grid_power` werden positive Werte als Netzbezug und negative Werte als
  Einspeisung getrennt summiert. `derivedMetricInverted` kehrt die Zuordnung um.
- Bei `battery_power` werden positive Werte als Ladung und negative Werte als
  Entladung getrennt summiert. `derivedMetricInverted` kehrt die Zuordnung um.
- Zeiträume mit abgeschnittenen Rohdaten werden nicht als vollständig
  behandelt; das Ergebnis wird `uncertain` oder abgelehnt.

## Ergebnisvertrag

Die Ausgabe enthält mindestens:

```text
importKwh / chargeKwh
exportKwh / dischargeKwh
quality: complete | gaps | uncertain | missing
integratedIntervals
skippedIntervals
sourceUnit, normalizedUnit, conversionFactor
```

Eine Energiebilanz verwendet integrierte Leistungsrollen nur, wenn alle
Pflichtrollen dieselbe Systemgrenze und eine ausreichende Datenqualität haben.
Andernfalls bleibt die Rolle informativ und die Bilanz weist die Lücke aus.

## Nicht-Ziele

- Keine lineare Interpolation über Datenlücken.
- Keine automatische Wahl einer Leistungsrolle anhand von Namen.
- Keine rückwirkende Korrektur gespeicherter Chatantworten.
