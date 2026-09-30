# Robuste Energie-Periodenauswertung

Status: Implementiert
Datum: 2026-09-30

## Ziel

Tageszähler und kumulative Energiezähler sollen für lokale Kalendertage
reproduzierbar ausgewertet werden. Ein verspäteter Tagesreset darf keinen Wert
des Vortags in den neuen Tag übernehmen.

## Vertrag

- `daily_reset_counter` wertet pro lokalem Kalendertag nur das Segment nach dem
  letzten deutlichen Rücksprung aus und verwendet dessen Maximum.
- Deutliche Rücksprünge werden als Reset dokumentiert; mehrere Rücksprünge oder
  ungültige Werte markieren das Ergebnis als unsicher.
- `cumulative_total` summiert positive Differenzen segmentweise. Rücksprünge
  starten ein neues Segment und werden als Reset ausgewiesen.
- `dayOffset` verschiebt lokale Kalendertage kalenderbasiert, nicht durch eine
  feste Millisekundenanzahl; DST-Tage dürfen 23 oder 25 Stunden haben.
- Bestehende Systemgrenzen bleiben unverändert: Leistungsintegration ist kein
  Teil dieses Fixes, weil die Architektur lückenhafte Leistungsreihen bewusst
  nicht für Energiebilanzen integriert.

## Nicht-Ziele

- Keine automatische Änderung bestehender Katalogrollen.
- Keine erfundenen Einheiten oder standortbezogenen Zeitzonenmetadaten.
- Keine rückwirkende Korrektur bereits gespeicherter Chatantworten.
