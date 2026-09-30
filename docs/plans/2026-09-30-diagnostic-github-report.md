# Umsetzung: Fehlerbericht mit GitHub-Vorschau

1. Reine Redaction-/Payload-/GitHub-Link-Helfer in `admin/tab.js` ergänzen.
2. Admin-Tab um „Fehler melden“, Eingabefelder und Vorschau erweitern.
3. Nur sichere Laufzeitmetadaten über `getObject`/`getState` sammeln.
4. Unit-Tests für Redaction und Linkaufbau ergänzen.
5. `npm test`, Lint und `git diff --check` ausführen.
6. Jede Assistentenantwort mit einer kontextbezogenen Report-Aktion versehen;
   Chatfrage und Antwort redigiert in die Vorschau übernehmen.

Nicht enthalten: GitHub-API-Token, automatische Issue-Erstellung,
Backend-Integration oder Übertragung roher Smart-Home-Daten.
