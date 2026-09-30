# Plan: Unsichere Energiebilanz

Status: Abgeschlossen

1. Tests: lückenhafte, abgeschnittene und vollständige Leistungsperioden sowie
   unsichere Zählerperioden für aktuelle und Baseline-Tage abdecken.
2. Tagesauswertung strukturiert als `{ residual, quality, qualityReasons }`
   zurückgeben.
3. Baseline-Residuals mit nicht vollständiger Qualität verwerfen.
4. Bei unvollständigem aktuellem Tag Anomalieerkennung mit `currentValue: null`
   und `dataCompleteness: gaps` aufrufen.
5. Kandidaten um Qualitätsgründe ergänzen und den Antwortprompt anweisen,
   fehlende Daten statt einer erfundenen Bilanzabweichung zu melden.
6. Fachtests, vollständige Tests, Lint und Diff-Prüfung ausführen.
