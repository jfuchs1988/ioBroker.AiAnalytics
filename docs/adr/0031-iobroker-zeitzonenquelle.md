# ADR-0031: ioBroker- und Host-Zeitzone mit explizitem Override

**Status:** Angenommen
**Datum:** 2026-09-30

## Kontext

ioBroker-Perioden werden anhand absoluter Unix-Zeitstempel aus History-Adaptern
gebildet. Die IANA-Zeitzone ist keine Eigenschaft dieser Zeitstempel; sie muss
aus der ioBroker-/Host-Konfiguration oder explizit aus der Adaptereinstellung
kommen. Abweichende Zonen können Tagesgrenzen verschieben.

## Entscheidung

Ein Resolver verwendet eine valide explizite Adapterzone, sonst eine valide
optionale `system.config.common.timeZone`, sonst die von Node.js erkannte
ioBroker-Hostzone. Alle Quellen, effektive Zone und Konflikte werden in
`info.timeZone` gespeichert; widersprüchliche Quellen erzeugen eine Warnung.
Die Admin-Einstellung ist ein optionaler Override, kein stilles Auto-Lernen aus
Messwerten.

## Konsequenzen

- Alle Adapterberechnungen verwenden dieselbe nachvollziehbare Zone.
- Ungültige oder widersprüchliche Zonen werden sichtbar statt geraten.
- Ein automatischer Abgleich mit der „Datenbankzeitzone“ ist nicht möglich,
  weil History-Zeitstempel absolute Unix-Zeitpunkte sind und keine lokale Zone
  kodieren.
