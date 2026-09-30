# ADR-0030: Sichere Leistungsintegration mit Lückenmarkierung

**Status:** Angenommen
**Datum:** 2026-09-30

## Kontext

Huawei-/Smart-Meter-Daten liefern teilweise nur signierte Momentanleistung.
Eine direkte Addition ist fachlich falsch. Eine unkritische Integration über
fehlende Messpunkte würde dagegen Energie erfinden und Energiebilanzen
scheinbar plausibel machen.

## Entscheidung

Leistungsintegration erfolgt nur mit Rohpunkten, trapezförmig und getrennt nach
positivem und negativem Energiefluss. Intervalle über 15 Minuten werden
übersprungen und als Lücke ausgewiesen. Abgeschnittene Rohdaten verhindern eine
vollständige Bilanzverwendung.

## Konsequenzen

- Energie aus Leistung ist nachvollziehbar und vorzeichenrichtig.
- Lücken führen zu einer sichtbaren Unsicherheit statt zu stiller Interpolation.
- Die Implementierung benötigt einen begrenzten Rohdatenvertrag und kann bei
  sehr dichter Historie bewusst kein vollständiges Ergebnis liefern.
- Bestehende Zählerauswertungen bleiben unverändert.
