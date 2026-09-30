// lib/periodValue.js
'use strict';

const { getHistory } = require('./dataAccess');
const { getLocalTimeZone, getLocalDayBoundaries, shiftLocalCalendarDay } = require('./promptContext');
const { getUnitSpec, normalizeValue } = require('./unitNormalization');
const { integratePower } = require('./powerIntegration');
const MAX_HISTORY_RANGE_MS = 10 * 366 * 24 * 3600 * 1000;
const RESET_ABSOLUTE_THRESHOLD = 0.01;
const RESET_RELATIVE_THRESHOLD = 0.2;

function booleanValue(value) {
    if (typeof value === 'string') return !['', '0', 'false', 'off', 'no'].includes(value.trim().toLowerCase());
    return value === true || value === 1;
}

function pointValue(point, unitSpec) {
    return normalizeValue(point && (point.max !== undefined ? point.max : point.val), unitSpec);
}

function withUnitMetadata(result, entry, unitSpec) {
    if (!entry.derivedMetricRole) return result;
    return { ...result, sourceUnit: unitSpec.sourceUnit, normalizedUnit: unitSpec.normalizedUnit, conversionFactor: unitSpec.conversionFactor };
}

function localDateKey(timestamp, timeZone) {
    const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(timestamp));
    const values = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function resolvePeriod(period, now = Date.now()) {
    if (typeof period.dayOffset === 'number') {
        const target = shiftLocalCalendarDay(now, period.dayOffset, getLocalTimeZone());
        return getLocalDayBoundaries(target, getLocalTimeZone());
    }
    return { start: period.start, end: period.end };
}

async function computePeriodValue(adapter, entry, period) {
    const { historyInstance, sourceId } = entry;
    const kind = entry.valueKind || 'gauge';

    if (kind === 'enum_state' || kind === 'text_state') {
        throw new Error(`valueKind '${kind}' ist nicht numerisch auswertbar.`);
    }

    if (kind === 'boolean_state') {
        const lookback = Math.min(MAX_HISTORY_RANGE_MS, Math.max(0, MAX_HISTORY_RANGE_MS - (period.end - period.start)));
        const points = await getHistory(adapter, historyInstance, sourceId, period.start - lookback, period.end, 'onchange');
        if (points.truncated === true) throw new Error('Boolean-History ist wegen des Rohdatenlimits unvollständig.');
        let onDurationMs = 0;
        let lastTs = period.start;
        let lastVal = false;
        let switchCount = 0;
        for (const point of points) {
            if (point.ts < period.start) {
                lastVal = booleanValue(point.val);
                continue;
            }
            switchCount++;
            if (lastVal) onDurationMs += point.ts - lastTs;
            lastTs = point.ts;
            lastVal = booleanValue(point.val);
        }
        if (lastVal) onDurationMs += period.end - lastTs;
        return { onDurationMs, switchCount };
    }

    const unitSpec = getUnitSpec(entry);

    if (kind === 'daily_reset_counter') {
        const points = await getHistory(adapter, historyInstance, sourceId, period.start, period.end, 'minmax');
        const dailyPoints = new Map();
        const invalidPoints = points.some(point => {
            const value = pointValue(point, unitSpec);
            return value !== null && value < 0;
        });
        for (const point of points) {
            const value = pointValue(point, unitSpec);
            if (value === null || value < 0) continue;
            const day = Number.isFinite(point.ts) ? localDateKey(point.ts, getLocalTimeZone()) : 'period';
            if (!dailyPoints.has(day)) dailyPoints.set(day, []);
            dailyPoints.get(day).push({ ...point, value });
        }
        const resets = [];
        let uncertain = invalidPoints;
        const dailyMaximums = [];
        for (const dayPoints of dailyPoints.values()) {
            dayPoints.sort((a, b) => a.ts - b.ts);
            let lastResetIndex = 0;
            let dayResetCount = 0;
            for (let index = 1; index < dayPoints.length; index++) {
                const previous = dayPoints[index - 1].value;
                const current = dayPoints[index].value;
                const drop = previous - current;
                if (drop > Math.max(RESET_ABSOLUTE_THRESHOLD, previous * RESET_RELATIVE_THRESHOLD)) {
                    lastResetIndex = index;
                    resets.push(dayPoints[index].ts);
                    dayResetCount++;
                }
            }
            if (dayResetCount > 1) uncertain = true;
            const activeSegment = dayPoints.slice(lastResetIndex);
            if (activeSegment.length) dailyMaximums.push(Math.max(...activeSegment.map(point => point.value)));
        }
        return withUnitMetadata({ total: dailyMaximums.reduce((sum, value) => sum + value, 0), quality: uncertain ? 'uncertain' : 'ok', resets }, entry, unitSpec);
    }

    if (kind === 'cumulative_total') {
        const [beforePoints, periodPoints] = await Promise.all([
            getHistory(adapter, historyInstance, sourceId, period.start - 24 * 3600 * 1000, period.start, 'onchange'),
            getHistory(adapter, historyInstance, sourceId, period.start, period.end, 'onchange'),
        ]);
        if (beforePoints.truncated || periodPoints.truncated) {
            throw new Error('History eines kumulativen Zaehlers ist wegen des Rohdatenlimits unvollstaendig.');
        }
        const validBefore = beforePoints.filter(point => {
            const value = pointValue(point, unitSpec);
            return value !== null && value >= 0;
        });
        let previous = validBefore.length ? pointValue(validBefore[validBefore.length - 1], unitSpec) : 0;
        let total = 0;
        const resets = [];
        let uncertain = false;
        for (const point of periodPoints) {
            const current = pointValue(point, unitSpec);
            if (current === null || current < 0) {
                uncertain = true;
                continue;
            }
            if (current >= previous) {
                total += current - previous;
            } else {
                total += current;
                resets.push(point.ts);
                uncertain = true;
            }
            previous = current;
        }
        return withUnitMetadata({ total, quality: uncertain ? 'uncertain' : 'ok', resets }, entry, unitSpec);
    }

    if (kind === 'event_count') {
        const points = await getHistory(adapter, historyInstance, sourceId, period.start, period.end, 'total');
        const total = points.reduce((sum, point) => sum + (Number.isFinite(point.val) ? point.val : 0), 0);
        return { total };
    }

    const points = (await getHistory(adapter, historyInstance, sourceId, period.start, period.end, 'average'))
        .map(point => ({ ...point, val: normalizeValue(point.val, unitSpec) }))
        .filter(point => Number.isFinite(point.ts) && Number.isFinite(point.val) && point.ts < period.end)
        .sort((a, b) => a.ts - b.ts);
    const values = points.map(point => point.val);
    let weightedSum = 0;
    let weightedDuration = 0;
    points.forEach((point, index) => {
        const start = Math.max(period.start, point.ts);
        const end = Math.min(period.end, points[index + 1] ? points[index + 1].ts : period.end);
        if (end > start) {
            weightedSum += point.val * (end - start);
            weightedDuration += end - start;
        }
    });
    const avg = weightedDuration ? weightedSum / weightedDuration : values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    return withUnitMetadata({ avg, min: values.length ? Math.min(...values) : 0, max: values.length ? Math.max(...values) : 0 }, entry, unitSpec);
}

async function computePeriodEnergy(adapter, entry, period) {
    if (!['grid_power', 'battery_power'].includes(entry.derivedMetricRole)) {
        throw new Error('Leistungsintegration benötigt eine grid_power- oder battery_power-Rolle.');
    }
    const unitSpec = getUnitSpec(entry);
    const points = await getHistory(adapter, entry.historyInstance, entry.sourceId, period.start, period.end, 'none');
    const integrated = integratePower(points, { conversionFactor: unitSpec.conversionFactor, inverted: entry.derivedMetricInverted === true });
    return {
        ...integrated,
        quality: points.truncated === true ? 'uncertain' : integrated.quality,
        sourceUnit: unitSpec.sourceUnit,
        normalizedUnit: unitSpec.normalizedUnit,
        conversionFactor: unitSpec.conversionFactor,
    };
}

module.exports = { resolvePeriod, computePeriodValue, computePeriodEnergy };
