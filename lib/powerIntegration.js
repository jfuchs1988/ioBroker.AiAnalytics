'use strict';

const DEFAULT_MAX_GAP_MS = 15 * 60 * 1000;

function integratePower(points, { conversionFactor = 1, inverted = false, maxGapMs = DEFAULT_MAX_GAP_MS } = {}) {
    const clean = (points || [])
        .map(point => ({ ts: Number(point && point.ts), value: Number(point && (point.val !== undefined ? point.val : point.value)) }))
        .filter(point => Number.isFinite(point.ts) && Number.isFinite(point.value))
        .sort((a, b) => a.ts - b.ts);
    let positiveKwh = 0;
    let negativeKwh = 0;
    let integratedIntervals = 0;
    let skippedIntervals = 0;
    let invalidPoints = clean.length !== (points || []).length;

    for (let index = 1; index < clean.length; index++) {
        const previous = clean[index - 1];
        const current = clean[index];
        const deltaMs = current.ts - previous.ts;
        if (deltaMs <= 0 || deltaMs > maxGapMs) {
            skippedIntervals++;
            continue;
        }
        const averageKw = ((previous.value + current.value) / 2) * conversionFactor * (inverted ? -1 : 1);
        const energyKwh = averageKw * (deltaMs / 3600000);
        if (averageKw >= 0) positiveKwh += energyKwh;
        else negativeKwh += Math.abs(energyKwh);
        integratedIntervals++;
    }

    const quality = !clean.length ? 'missing' : invalidPoints || skippedIntervals ? 'gaps' : 'complete';
    return { positiveKwh, negativeKwh, quality, integratedIntervals, skippedIntervals };
}

module.exports = { DEFAULT_MAX_GAP_MS, integratePower };
