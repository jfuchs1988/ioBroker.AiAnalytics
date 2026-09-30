# Plan: Robuste Energie-Periodenauswertung

Status: Abgeschlossen

1. Reproduzierende Unit-Tests für verspätete Tagesresets, mehrere Resets und
   kalenderbasierte DST-Offsets ergänzen.
2. `promptContext` um kalenderbasierte Tagesverschiebung erweitern.
3. `periodValue` für reset-segmentierte Tageszähler und qualifizierte
   kumulative Zähler anpassen.
4. Systemprompt und Datenmodell nur dort dokumentieren, wo die Ausgabe jetzt
   Reset-/Qualitätsinformationen liefern kann.
5. Fachtests, Lint und vollständige Tests ausführen; Admin-Build ist nicht nötig,
   da keine Admin-Quellen geändert werden.
