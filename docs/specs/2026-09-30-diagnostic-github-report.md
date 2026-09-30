# Fehlerbericht mit redigierten Diagnosedaten

## Ziel

Nutzer sollen aus dem ioBroker-Admin-Tab einen reproduzierbaren Fehlerbericht
für GitHub vorbereiten können. Variante A öffnet ausschließlich einen
vorausgefüllten GitHub-Issue-Link; der Nutzer prüft und veröffentlicht das
Issue selbst.

## Sicherheitsgrenzen

- Kein GitHub-Token und kein Sponsoring-/Entitlement-Token im Adapter.
- Keine automatische Veröffentlichung und kein Backend-Aufruf.
- Keine API-Keys, Passwörter, Tokens, IP-Adressen, Smart-Home-Werte,
  vollständigen Datenpunktnamen oder Chat-Inhalte im Bericht.
- Diagnosepayload wird begrenzt und vor dem Linkaufbau redigiert.
- Eine Vorschau mit Bearbeiten/Abbrechen ist verpflichtend.
- Jede Assistentenantwort im Chat bietet einen eigenen „Fehler melden“-Aktion.
- Der Chat-Kontext wird nur als redigierter Auszug vorgeschlagen; Zahlen,
  Messwerte und Objekt-IDs werden entfernt.

## Berichtsinhalte

Der Bericht enthält nur:

- manuell eingegebenen Titel, Schritte, erwartetes und tatsächliches Verhalten,
- Adapter-/Node-/js-controller-Version,
- Browserkennung,
- Provider-Typen ohne Zugangsdaten,
- Health-Status ohne Payloads,
- redigierte, begrenzte lokale Fehlertexte,
- Diagnosezeitpunkt und zufällige Diagnose-ID.

## Abnahmekriterien

- Button im Admin-Tab öffnet die Vorschau.
- Redaction entfernt bekannte Secret-/URL-/IP-Muster und begrenzt Textlängen.
- GitHub-Link enthält Repository, Label `bug`, Titel und Body.
- Nutzer muss den Link selbst öffnen und bei GitHub selbst absenden.
- Unit-Tests decken Redaction, Payload-Limit und URL-Building ab.
