# Plan: Kumulative Zähler-Ausreißer

Status: Abgeschlossen

1. Unit-Tests für konfigurierte Rate, statistischen Ausreißer, Reset,
   unvollständige Probe und reguläre Schwankungen ergänzen.
2. `maxPlausibleKwhPerHour` im Katalogvertrag, Admin-Editor und CSV-Import/
   Export ergänzen.
3. Den Wert für `cumulative_total` validieren und in Periodendifferenzen
   anhand tatsächlicher Zeitstempel anwenden.
4. Ausreißer nicht addieren; `quality: uncertain`, Zeitpunkte und Ursache
   zurückgeben.
5. Tool-Ausgaben und Energiebilanzqualitätsgründe synchronisieren.
6. Vollständige Tests, Admin-Build und Lint ausführen.
