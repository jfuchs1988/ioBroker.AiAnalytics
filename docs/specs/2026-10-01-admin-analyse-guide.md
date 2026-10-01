# Admin-Wissensbereich für Analyse und Datenpunkt-Katalog

Status: Implementiert
Datum: 2026-10-01

## Ziel

Die Admin-Oberfläche soll verständlich und vollständig erklären, was AI Analytics
analysiert, wie Chat- und proaktive Analysen ablaufen, welche Werkzeuge der Agent
nutzt und was Kategorien sowie Katalogeigenschaften bedeuten. Die Hilfe richtet
sich sowohl an Anwender, die nur Ergebnisse verstehen wollen, als auch an
Fortgeschrittene, die Katalogfelder und Rechenregeln konfigurieren.

## Ausgangslage

Die bestehende `How To`-Seite (`HowToComponent`) hat sechs kurze Textabschnitte.
Die Geräteliste zeigt viele interne Enum-Werte direkt in Dropdowns und Spalten.
Eine vollständige Zuordnung von Begriff → mögliche Ausprägungen → Wirkung auf
die Analyse fehlt. Eine kleine Legende zu Energierollen existiert bereits in der
Geräteliste, erklärt aber weder die übrigen Felder noch den gesamten Ablauf.

## UX-Entscheidung

- Die vorhandene `How To`-Seite wird zum zentralen **„Wissen & Analyse“**-
  Nachschlagebereich ausgebaut; es kommt kein zusätzlicher Admin-Tab hinzu.
- Die Inhalte werden auf Deutsch und Englisch angeboten, mit einer sichtbaren,
  zugänglichen Sprachauswahl. Deutsch ist die Voreinstellung.
- Die Seite wird in klar benannte, verlinkbare Bereiche gegliedert: Überblick,
  Ablauf, Werkzeuge, Kategorien, Datenpunkt-Lexikon, Beispiele und Grenzen.
- Lange technische Details dürfen eingeklappt sein; die kurze Zusammenfassung
  und häufig benötigte Feldhilfen bleiben direkt sichtbar.
- In der Geräteliste erhalten wichtige semantische Felder eine kurze
  kontextbezogene Erklärung. Die vollständigen Wertelisten und Wechselwirkungen
  bleiben im zentralen Lexikon.
- Inhalte sind reine Admin-Dokumentation: kein zusätzlicher Provider-Aufruf,
  kein Zugriff auf Nutzerdaten und keine Änderung der Analyseberechnung.

## Verbindlicher Inhalt

### 1. Was das System macht

Erklären, dass ausschließlich Datenpunkte mit bereits aktiviertem History-,
InfluxDB- oder SQL-Logging gelesen werden. AI Analytics aktiviert kein Logging
und schreibt keine fremden ioBroker-Objekte. Katalogänderungen sind eine
separate, ausdrücklich bestätigte Funktion.

### 2. Analyseablauf

Den Ablauf als verständliche Schritte darstellen und Chat von proaktiver Prüfung
unterscheiden:

1. Discovery findet historisierte Objekte und führt sie im Katalog.
2. Onboarding schlägt Beschreibung, Kategorie und mögliche Analyse-Rollen vor;
   Wertverhalten und Datenqualität werden anhand von Metadaten/History erkannt.
3. Unsichere Klassifikationen bleiben mit `needsReview` sichtbar.
4. Bei Chat-Fragen wählt der Agent passende Katalogeinträge und Werkzeuge.
5. Bei proaktiven Prüfungen filtern statistische, Energie- und HVAC-Regeln
   zunächst Kandidaten; nur verdichtete Kandidaten gehen anschließend an die KI.
6. Die KI erklärt Messgrundlage, Zeitraum, Auffälligkeit und verbleibende
   Unsicherheit.

Nicht behaupten, dass jede proaktive Prüfung jedes Werkzeug verwendet oder dass
die KI rohe Datenbankabfragen ausführt.

### 3. Werkzeugkatalog

Für jedes Analysewerkzeug Zweck, typische Frage, wesentliche Eingaben,
Ergebnisform und wichtige Einschränkungen erklären:

- `listCatalog`
- `getHistory`
- `compareTimeframes`
- `getPeriodTotal`
- `comparePeriods`
- `getPeriodEnergy`
- `getSelfConsumption`

`updateCatalogEntry` und `updateCatalogEntries` werden separat als
Katalogpflege, nicht als Analysewerkzeuge, gekennzeichnet. Chat-Schreibzugriff
ist auf ausdrücklich erklärte/zu bestätigende Katalogänderungen begrenzt;
proaktive Prüfungen laufen mit read-only Werkzeugen.

### 4. Kategorien und Rechenverhalten auseinanderhalten

Die Kategorien werden mit kurzer Definition und Beispiel erklärt:

- `consumption`
- `generation_pv`
- `lighting`
- `device_usage`
- `environment`

Explizit klarstellen: `category` ist die fachliche Sortierung/Filterung und
bestimmt allein nicht die Rechenoperation. Dafür ist `valueKind` zuständig.

### 5. Vollständiges Datenpunkt-Lexikon

Alle persistierten Felder werden nach Anwenderfeldern und technischen
Metadaten gruppiert. Für jedes Feld werden Typ, mögliche Ausprägungen,
automatische oder manuelle Herkunft und der Einfluss auf Auswahl, Auswertung
oder Anzeige dokumentiert.

Mindestens abzudecken:

- Identität und Darstellung: `sourceId`, `historyInstance`, `description`,
  `category`, `room`, `unit`.
- Rechenverhalten: `valueKind`, `valueKindConfidence`, `valueKindSource`.
- Datenqualität: `writable`, `writePattern`, `updateFrequency`,
  `dataCompleteness`, `dataQualitySource`, `maxPlausibleKwhPerHour`.
- Analysezuordnung: `derivedMetricRole`, `derivedMetricGroupId`,
  `derivedMetricInverted`, `hvacRole`.
- Status und Vertrauensherkunft: `active`, `ignored`, `needsReview`,
  `reviewReasons`, `confidence`, `classificationSource`, `lastSeen` und
  `userConfirmedAt`.

Alle Ausprägungen von `valueKind`, `writePattern`, `updateFrequency`,
`dataCompleteness`, Energie-Rollen, HVAC-Rollen und Review-Gründen werden
erklärt. Wichtige Abhängigkeiten müssen direkt auffindbar sein, insbesondere:

- Kategorien ordnen fachlich; `valueKind` bestimmt die Rechnung.
- Energiezähler-Rollen benötigen `daily_reset_counter` oder
  `cumulative_total`; `grid_power`/`battery_power` benötigen `gauge`.
- HVAC-Rollen benötigen `boolean_state`; Fenster-/Heizungs-Korrelation benötigt
  außerdem denselben Raum.
- `derivedMetricGroupId` verbindet Anlagenwerte zu einer Bilanzgruppe;
  `derivedMetricInverted` kehrt das Vorzeichen einer Leistungsrolle um.
- `gaps`, `stale`, `uncertain`, Reset-Metadaten und `needsReview` dürfen nicht
  als bestätigte fachliche Abweichung missverstanden werden.

### 6. Beispiele

Mindestens drei nachvollziehbare Beispiele zeigen Eingabe → verwendete
Werkzeuge/Regeln → Rechenweg → Aussagegrenzen:

- Tageszähler gegenüber Momentanleistung (`getPeriodTotal` vs.
  `getPeriodEnergy`).
- Energiebilanz mit Zählerrollen bzw. signierter Leistung und sichtbarer
  Datenlücke.
- Heizungs-/Fenster-Korrelation pro Raum.

Beispiele verwenden synthetische Werte und reale Tool-/Feldnamen, keine
installationsspezifischen IDs.

## Akzeptanzkriterien

- Deutsch und Englisch können in der How-To-Seite explizit gewählt werden.
- Alle sieben Analysewerkzeuge, fünf Kategorien und sämtliche oben genannten
  Katalogfelder/Ausprägungen sind in der Referenz enthalten.
- Unterschied zwischen `category`, `valueKind` und Analyse-Rollen ist anhand
  von Beispielen eindeutig.
- Die Geräte-UI erklärt wichtige Dropdowns/Felder auch direkt am Ort ihrer
  Verwendung; die vollständigen Erläuterungen sind zentral erreichbar.
- Die Aussagen stimmen mit den aktuellen Tool-Schemas und
  `lib/*`-Berechnungen überein.
- Inhalte sind mit Tastatur und Screenreader erreichbar und auf schmalen
  Admin-Ansichten lesbar.
- Es gibt keine Änderung an Backend-Berechnungen, Berechtigungen oder
  Schreibverhalten.

## Nicht-Ziele

- Keine Änderung an Kategorien, Klassifizierungsregeln, Schwellwerten,
  Tool-Schemas oder Datenmodell.
- Keine zusätzlichen Analytics- oder Provider-Aufrufe durch die Hilfe.
- Keine Abfrage oder Anzeige konkreter Nutzerdaten in Beispielen.
