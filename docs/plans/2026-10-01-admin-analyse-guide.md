# Plan: Admin-Wissensbereich für Analyse und Datenpunkt-Katalog

Status: Implementiert. Browser-Abnahme gegen eine laufende ioBroker-Admin-Instanz steht noch aus.

## Ziel / Abschlusskriterium

Die bestehende How-To-Seite wird zu einer deutsch-/englischsprachigen
Analyse- und Katalogreferenz ausgebaut. Die Geräteliste bekommt kontextbezogene
Hilfen. Sämtliche Aussagen werden gegen Backend-Konstanten, Tool-Schemas und
Berechnungen getestet. Siehe [Spec](../specs/2026-10-01-admin-analyse-guide.md).

## Schritte (testgetrieben)

1. **Dokumentationsdaten und Vollständigkeitstests**
   - Deutsche und englische Beschreibungen für Kategorien, Werte, Felder,
     Werkzeuge, Analyseablauf und Beispiele als strukturierte Daten anlegen.
   - Tests stellen sicher, dass alle Kategorien, `valueKind`s, Datenqualitäts-
     und Rollen-Ausprägungen sowie alle Analysewerkzeuge erklärt sind.
   - Tests validieren, dass jede Definition beide Locale-Texte und eine Aussage
     über Herkunft/Einfluss hat.

2. **How-To-Seite ausbauen**
   - Bestehende `HowToComponent` als „Wissen & Analyse“ ausweisen.
   - Zugängliche DE/EN-Auswahl, Abschnittsnavigation und mobile Accordion-
     Darstellung ergänzen.
   - Ablauf, Werkzeuge, Kategorien, vollständiges Datenpunkt-Lexikon,
     Abhängigkeiten, Beispiele und Grenzen rendern.

3. **Kontextuelle Feldhilfen**
   - Kleine, tastaturbedienbare Hilfe neben Kategorie, `valueKind`, Datenqualität,
     Energie- und HVAC-Feldern in der Geräteliste ergänzen.
   - Auf den zentralen Lexikonabschnitt verweisen, wo mehrere Ausprägungen oder
     Feldabhängigkeiten bestehen.
   - Tests für zugängliche Namen, aufgeklappte Erklärung und beide Sprachen.

4. **Dokumentation / Integration**
   - Admin-Bausteinsicht bei neuen Content-/UI-Modulen aktualisieren.
   - `WORKLOG.md` für den neuen Task aktualisieren, ohne die offene lokale
     `common.news`-Änderung aus dem anderen Worktree zu übernehmen.

5. **Verifikation**
   - `npm test`, `npm run lint`, `npm run build:admin`, `git diff --check`.
   - Admin-Seite breit und schmal manuell ansehen; DE/EN umschalten,
     Tastaturnavigation und Details öffnen/schließen.
