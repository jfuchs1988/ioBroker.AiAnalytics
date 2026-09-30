// Sponsor-required component. See LICENSES/SPONSOR-REQUIRED.md.
'use strict';

/**
 * Liest Standort-Infos aus dem ioBroker-Systemobjekt `system.config` (dort traegt der
 * Nutzer sie beim Setup ein). Fehlt das Objekt oder sind Felder leer, wird ein leeres
 * Ergebnis geliefert statt zu werfen.
 */
async function getSystemLocation(adapter) {
    const obj = await adapter.getForeignObjectAsync('system.config');
    const common = (obj && obj.common) || {};
    return {
        city: common.city || null,
        country: common.country || null,
        latitude: typeof common.latitude === 'number' ? common.latitude : null,
        longitude: typeof common.longitude === 'number' ? common.longitude : null,
    };
}

/**
 * Die lokale Zeitzone des ioBroker-Host-Prozesses (nicht des Nutzer-Browsers). Bei
 * einer typischen Home-Installation laeuft der Host beim Nutzer, die Systemzeitzone
 * ist also ein deutlich besserer Anhaltspunkt als UTC ohne jeden Zeitzonenbezug.
 */
function detectProcessTimeZone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (error) {
        return 'UTC';
    }
}

function validateTimeZone(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        return new Intl.DateTimeFormat('en', { timeZone: value.trim() }).resolvedOptions().timeZone;
    } catch (_error) {
        return null;
    }
}

function resolveTimeZone({ configuredTimeZone, systemTimeZone, processTimeZone = detectProcessTimeZone() } = {}) {
    const warnings = [];
    const configured = validateTimeZone(configuredTimeZone);
    const system = validateTimeZone(systemTimeZone);
    const process = validateTimeZone(processTimeZone) || 'UTC';

    if (configuredTimeZone && !configured) warnings.push(`Adapter-Zeitzone '${configuredTimeZone}' ist ungueltig.`);
    if (systemTimeZone && !system) warnings.push(`system.config-Zeitzone '${systemTimeZone}' ist ungueltig.`);
    if (configured && system && configured !== system) warnings.push(`Adapter-Zeitzone '${configured}' weicht von system.config '${system}' ab.`);
    if (configured && process && configured !== process) warnings.push(`Adapter-Zeitzone '${configured}' weicht von der ioBroker-Prozesszeitzone '${process}' ab.`);
    if (!configured && system && process && system !== process) warnings.push(`system.config-Zeitzone '${system}' weicht von der ioBroker-Prozesszeitzone '${process}' ab.`);

    const effectiveTimeZone = configured || system || process;
    return {
        effectiveTimeZone,
        source: configured ? 'adapter' : system ? 'system.config' : 'process',
        configuredTimeZone: configured || null,
        systemTimeZone: system || null,
        processTimeZone: process,
        historyTimestampZone: 'UTC',
        warnings,
    };
}

function getLocalTimeZone(adapter) {
    if (adapter && typeof adapter.aiAnalyticsTimeZone === 'string' && validateTimeZone(adapter.aiAnalyticsTimeZone)) {
        return validateTimeZone(adapter.aiAnalyticsTimeZone);
    }
    const resolution = resolveTimeZone({ configuredTimeZone: adapter && adapter.config && adapter.config.timeZone });
    return resolution.effectiveTimeZone;
}

function formatLocalTime(date, timeZone) {
    try {
        return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'medium', timeZone }).format(date);
    } catch (error) {
        return date.toISOString();
    }
}

/**
 * Computes the UTC millisecond timestamp of local midnight for the calendar day
 * containing `timestampMs` in the given `timeZone`. This is the foundation for
 * computing day boundaries across DST transitions.
 */
function computeUtcMidnight(timestampMs, timeZone) {
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const dateParts = dateFormatter.formatToParts(new Date(timestampMs));
    const year = Number(dateParts.find((part) => part.type === 'year').value);
    const month = Number(dateParts.find((part) => part.type === 'month').value);
    const day = Number(dateParts.find((part) => part.type === 'day').value);
    const utcMidnightGuess = Date.UTC(year, month - 1, day);

    const offsetFormatter = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' });
    const offsetName = offsetFormatter.formatToParts(new Date(utcMidnightGuess)).find(
        (part) => part.type === 'timeZoneName'
    ).value;
    const offsetMatch = /GMT([+-]\d{1,2})(?::(\d{2}))?/.exec(offsetName);
    const offsetHours = offsetMatch ? Number(offsetMatch[1]) : 0;
    const offsetMinutesPart = offsetMatch && offsetMatch[2] ? Number(offsetMatch[2]) : 0;
    const offsetMs = (offsetHours * 60 + Math.sign(offsetHours || 1) * offsetMinutesPart) * 60 * 1000;

    return utcMidnightGuess - offsetMs;
}

/**
 * Start/Ende (Unix-ms) des Kalendertags in `timeZone`, der `timestampMs` enthaelt.
 * Berechnet den lokalen Offset AM ZIELTAG (nicht "jetzt"), damit DST-Wechsel korrekt
 * behandelt werden. Wird fuer typ-bewusste Tagesauswertungen gebraucht (Tageszaehler-
 * Reset, Boolean-Zustandsdauer je Tag).
 *
 * IMPORTANT: end is computed as the actual next local midnight (not start + 24h)
 * because local calendar days aren't always 24 hours: on spring-forward (DST start)
 * days they are 23 hours, on fall-back (DST end) days they are 25 hours. Computing
 * end as start + 24h would land outside the actual calendar day on DST transitions.
 */
function getLocalDayBoundaries(timestampMs, timeZone) {
    const start = computeUtcMidnight(timestampMs, timeZone);
    const end = computeUtcMidnight(start + 25 * 3600 * 1000, timeZone);
    return { start, end };
}

/**
 * Returns a timestamp on the local calendar day shifted by `dayOffset`.
 * Shifting the instant by 24 hours is incorrect around DST transitions; the
 * date is shifted in a UTC calendar representation and then passed to the
 * boundary resolver, which applies the offset of the target date.
 */
function shiftLocalCalendarDay(timestampMs, dayOffset, timeZone) {
    const parts = new Intl.DateTimeFormat('en', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date(timestampMs));
    const values = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
    const utcNoon = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), 12);
    return utcNoon + dayOffset * 24 * 3600 * 1000;
}

/**
 * Baut den Standort-/Zeit-Kontextblock fuer Agent-Systemprompts. Wird sowohl fuer
 * Chat-Fragen als auch die proaktive Pruefung verwendet, damit der Agent Fragen wie
 * "wo bin ich" / "wie spaet ist es bei mir" beantworten kann, statt zu raten.
 */
async function buildTimeAndLocationContext(adapter, now = new Date()) {
    const [location, systemConfig] = await Promise.all([
        getSystemLocation(adapter),
        adapter.getForeignObjectAsync('system.config'),
    ]);
    const systemTimeZone = systemConfig && systemConfig.common && systemConfig.common.timeZone;
    const timeZone = adapter.aiAnalyticsTimeZone || resolveTimeZone({
        configuredTimeZone: adapter.config && adapter.config.timeZone,
        systemTimeZone,
    }).effectiveTimeZone;
    const localTime = formatLocalTime(now, timeZone);

    const locationLabelParts = [location.city, location.country].filter(Boolean);
    const coordinates =
        location.latitude != null && location.longitude != null
            ? ` (Breite ${location.latitude}, Laenge ${location.longitude})`
            : '';
    const locationLine = locationLabelParts.length
        ? `Standort des Nutzers: ${locationLabelParts.join(', ')}${coordinates}. `
        : '';

    return (
        `${locationLine}` +
        `Aktuelle Zeit: ${now.toISOString()} (${now.getTime()} ms seit Epoch, Unix-Millisekunden), ` +
        `entspricht ${localTime} in der lokalen Zeitzone ${timeZone}. `
    );
}

module.exports = {
    getSystemLocation,
    getLocalTimeZone,
    resolveTimeZone,
    formatLocalTime,
    computeUtcMidnight,
    getLocalDayBoundaries,
    shiftLocalCalendarDay,
    buildTimeAndLocationContext,
};
