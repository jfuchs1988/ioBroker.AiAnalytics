# Einheitenprüfung und Normalisierung

Status: Implementiert
Datum: 2026-09-30

## Ziel

Energie- und Leistungsberechnungen dürfen nicht von einer stillschweigend
angenommenen Einheit abhängen. Werte in `Wh` und `kWh` sowie `W` und `kW` werden
vor einer typbewussten Berechnung eindeutig geprüft und intern normalisiert.

## Fachlicher Vertrag

### Energiezähler

Für `pv_generation`, `consumption`, `grid_import`, `grid_feed_in`,
`battery_charge` und `battery_discharge` sind ausschließlich `Wh` und `kWh`
zulässig. Intern wird immer in `kWh` gerechnet: `kWh` mit Faktor `1`, `Wh`
mit Faktor `0,001`.

### Leistungswerte

Für `grid_power` und `battery_power` sind ausschließlich `W` und `kW`
zulässig. Intern wird immer in `kW` gerechnet: `kW` mit Faktor `1`, `W` mit
Faktor `0,001`. Eine Energieintegration ist nicht Teil dieses Tasks.

### Fehler- und Unsicherheitsverhalten

- Fehlende, unbekannte oder widersprüchliche Einheiten werden nicht erraten.
- Ein Rollen-Eintrag mit ungültiger Einheit wird mit einer verständlichen
  Validierungsfehlermeldung abgelehnt.
- Andere Messpunkte bleiben unverändert.
- Die Antwort nennt Quelleneinheit, interne Einheit und Umrechnungsfaktor.

## Datenmodell

Die aus ioBroker-Metadaten übernommene Katalogeinheit bleibt erhalten. Ein
Ergebnisfeld `normalizedUnit` beschreibt die interne Recheneinheit; die
Quelleneinheit wird nicht überschrieben.

## Grenzen

- Keine Einheitenableitung aus Namen oder Objekt-IDs.
- Keine Umrechnung ohne explizite Einheit.
- Keine Umrechnung unklarer Hersteller-Spezialeinheiten.
- Keine Änderung bestehender Katalogrollen in diesem Task.
