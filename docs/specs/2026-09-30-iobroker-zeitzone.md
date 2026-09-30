# ioBroker-Zeitzone für lokale Kalendertage

Status: Implementiert
Datum: 2026-09-30

## Ziel

History-Perioden und „gestern/heute“ verwenden dieselbe Zeitzone wie der
ioBroker-Host. Konflikte oder ungültige Konfigurationen werden sichtbar
gemeldet; eine unbekannte Zeitzone wird nicht aus UTC-Zeitstempeln geraten.

## Quellenreihenfolge

1. Explizite Adaptereinstellung `timeZone`, wenn sie eine gültige IANA-Zone ist.
2. `system.config.common.timeZone`, falls die Installation dieses optionale
   Feld pflegt und es gültig ist.
3. Vom Node.js/ioBroker-Prozess erkannte Host-Zone
   (`Intl.DateTimeFormat().resolvedOptions().timeZone`).

Die effektive Zone wird als eigener Adapter-Info-State gespeichert. Konflikte
zwischen expliziter Zone, `system.config` und Prozesszone erzeugen Warnung und
Statusdetails. Eine ungültige explizite Zone wird nicht benutzt; es wird auf die
nächste gültige Quelle zurückgefallen.

## Datenbank-/History-Abgleich

History-Zeitstempel sind Unix-Zeitpunkte (UTC-basierte Instants); daraus lässt
sich nicht bestimmen, welche lokale Zeitzone ein Messgerät beim Reset oder eine
externe App verwendet hat. Darum darf das Produkt keine DB-Zeitzone erfinden.
Der Info-State weist diese Grenze aus und zeigt alle bekannten Zeitzonenquellen
an, damit ein Widerspruch zu Quellsystemen/Anzeigen erkennbar und explizit
konfigurierbar ist.

## Geltungsbereich

Die effektive Zone gilt für Prompt-Kontext, lokale Tagesgrenzen, Tageszähler-
Resetgruppierung und alle `dayOffset`-History-Werkzeuge. DST-Tage behalten ihre
23-/25-Stunden-Länge.

## Nicht-Ziele

- Kein automatisches Ableiten einer IANA-Zone aus Stadt/Koordinaten.
- Keine Änderung oder Umstempelung gespeicherter History-Daten.
- Kein stilles Überschreiben einer expliziten Adaptereinstellung.
