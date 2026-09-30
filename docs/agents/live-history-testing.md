# Live-Test gegen ioBroker und InfluxDB

[← Agent-Fachkontext](README.md)

Dieses Verfahren vergleicht Chat-Ergebnisse mit unabhängig berechneten
Referenzwerten aus der echten ioBroker-History. Es ist ein manueller,
read-only Live-Test für eine laufende ioBroker-Installation.

## Voraussetzungen

- Chrome läuft mit DevTools-Protokoll:

  ```powershell
  & "C:\Program Files\Google\Chrome\Application\chrome.exe" `
    --remote-debugging-port=9222 `
    --user-data-dir="$env:TEMP\chrome-iobroker-test"
  ```

- Ein Tab enthält die ioBroker-Admin-Oberfläche, ein zweiter die angemeldete
  InfluxDB-Weboberfläche.
- Zertifikate sind im Browser bestätigt bzw. vertrauenswürdig.
- Zugangsdaten und Tokens werden nie in Chat, Shell, Logs oder Dateien kopiert.

## Technik und Ablauf

### Browserzugriff

Der Test fragt `http://127.0.0.1:9222/json/list` ab und öffnet über den
jeweiligen `webSocketDebuggerUrl` eine Chrome-DevTools-Protocol-Verbindung.
Damit wird JavaScript in den bereits angemeldeten Tabs ausgeführt. Es werden
keine Passwörter ausgelesen; Tab-Inhalte bleiben untrusted data.

### InfluxDB-Referenz

Im InfluxDB-Tab werden die authentifizierte HTTP-API und Flux-Abfragen nur
lesend genutzt:

- `GET /api/v2/buckets?orgID=...`
- `POST /api/v2/query?orgID=...`
- `Content-Type: application/vnd.flux`, Antwort als CSV

Die Abfrage verwendet den Bucket `iobroker_bucket`, einen expliziten Zeitraum,
das Measurement und `_field == "value"`. CSV-Zeilen werden lokal in Werte und
Zeitstempel umgerechnet. Das ist nur die unabhängige Referenz; der Adapter
verwendet weiterhin die generische ioBroker-History-API.

### Adapterpfad

Über das Chat-Tab-Frame wird `listCatalogEntries` aufgerufen. Für Tests werden
nur aktive, nicht ignorierte und nicht offene `needsReview`-Einträge verwendet.
Die History-Instanz stammt aus dem Katalog, typischerweise `influxdb.0`.

Der Adapter liest so:

```js
socket.emit('sendTo', 'influxdb.0', 'getHistory', {
  id: sourceId,
  options: { start, end, aggregate, count }
}, callback)
```

Die KI bekommt keinen Flux-Zugriff, sondern nur die Werkzeuge aus
`lib/tools.js`: `listCatalog`, `getHistory`, `compareTimeframes`,
`getPeriodTotal`, `comparePeriods` und – bei vollständiger Gruppe –
`getSelfConsumption`.

### Chat und Vergleich

Eine Testfrage wird über `chatQuestion` an das Chat-Frame gesendet. Der
Tool-Calling-Agent wählt das Werkzeug. In der Antwort-History ist das Feld
`text` maßgeblich, nicht `content`.

Danach werden strukturierte Werte verglichen, typischerweise mit 2-%-Toleranz:

- Daily Counter: Tagesmaximum; Mehrtagessummen addieren die Tagesmaxima.
- Kumulativer Zähler: Differenzen aufeinanderfolgender Werte; Rückgänge als
  Reset behandeln.
- Boolean: `onDurationMs` und `switchCount`.
- Zeitraumvergleiche: beide Perioden und Delta unabhängig nachrechnen.
- Quoten: zusätzlich auf den Bereich 0 bis 1 prüfen.

Bei Daily Countern muss ein Rücksprung um Mitternacht in den Rohdaten sichtbar
sein. So wird geprüft, dass der Adapter nicht versehentlich einen Reset als
negativen Verbrauch wertet.

## Rollenänderungen

Zuerst werden Einheit, Namen, Resetverhalten, Verlauf und Cross-Checks geprüft;
erst nach ausdrücklicher Bestätigung darf `updateCatalogEntryAdmin` verwendet
werden. Danach Katalog, Tool-Aufruf und Referenzberechnung erneut prüfen.

Verbrauchs- und Energiebilanzrollen nicht nur nach Namensähnlichkeit setzen.
Ein innerhalb eines Tages fallender „Gesamtzähler“ muss fachlich geklärt sein.

## Aktueller Umfang

Erfolgreich live geprüft wurden `listCatalog`, `getHistory`,
`compareTimeframes`, `getPeriodTotal` für Gauge, Daily Counter, kumulativen
Zähler und Boolean sowie `comparePeriods`. Eine PV-/Netzeinspeisegruppe wurde
anschließend mit `getSelfConsumption` gegen die direkte History-Berechnung
verifiziert.

HVAC-Korrelation und vollständige Energiebilanz bleiben offen, solange keine
vollständigen Rollen-Gruppen im Katalog vorhanden sind.

## Grenzen

Der Test benötigt eine laufende, angemeldete Browser-Sitzung und ist kein
CI-Test. Keine Provider-Keys, Tokens, vollständigen Datenpunktlisten oder
Messwerte in dauerhafte Dokumentation übernehmen. Katalogänderungen bleiben
bestehen und müssen bei Bedarf gezielt über die Admin-Oberfläche zurückgesetzt
werden.
