// lib/energyBalance.js
'use strict';

const { computePeriodValue, computePeriodEnergy, resolvePeriod } = require('./periodValue');
const { detectDailyAggregateAnomaly } = require('./anomalyDetector');

const REQUIRED_ROLES = ['pv_generation', 'grid_import', 'grid_feed_in', 'consumption'];
const BATTERY_ROLES = ['battery_charge', 'battery_discharge'];
const BASELINE_DAY_OFFSETS = [-8, -7, -6, -5, -4, -3, -2];
const CURRENT_DAY_OFFSET = -1;
const DATA_COMPLETENESS_SEVERITY = { stale: 2, gaps: 1, unknown: 0, complete: 0 };
const COUNTER_VALUE_KINDS = new Set(['daily_reset_counter', 'cumulative_total']);

function isEnergyBalanceCandidate(entry) {
    return Boolean(entry && entry.active !== false && !entry.ignored && entry.derivedMetricGroupId && entry.derivedMetricRole);
}

function groupByDerivedMetricGroupId(entries) {
    const groups = new Map();
    for (const entry of entries.filter(isEnergyBalanceCandidate)) {
        if (!groups.has(entry.derivedMetricGroupId)) groups.set(entry.derivedMetricGroupId, []);
        groups.get(entry.derivedMetricGroupId).push(entry);
    }
    return groups;
}

function resolveGroupRoles(groupEntries) {
    const byRole = {};
    for (const role of [...REQUIRED_ROLES, ...BATTERY_ROLES]) {
        const matches = groupEntries.filter((entry) => entry.derivedMetricRole === role);
        if (matches.length > 1) return null;
        byRole[role] = matches[0];
    }
    const gridPower = groupEntries.filter(entry => entry.derivedMetricRole === 'grid_power');
    const batteryPower = groupEntries.filter(entry => entry.derivedMetricRole === 'battery_power');
    if (gridPower.length > 1 || batteryPower.length > 1) return null;
    const hasGridCounters = Boolean(byRole.grid_import && byRole.grid_feed_in);
    if (!byRole.pv_generation || !byRole.consumption || (!hasGridCounters && gridPower.length !== 1)) return null;
    if ([byRole.pv_generation, byRole.consumption, byRole.grid_import, byRole.grid_feed_in, byRole.battery_charge, byRole.battery_discharge].filter(Boolean).some(entry => !COUNTER_VALUE_KINDS.has(entry.valueKind))) return null;
    const hasBatteryCounters = Boolean(byRole.battery_charge && byRole.battery_discharge);
    if (Boolean(byRole.battery_charge) !== Boolean(byRole.battery_discharge)) return null;
    if (!hasBatteryCounters && batteryPower.length > 0 && batteryPower.length !== 1) return null;
    if (hasBatteryCounters && batteryPower.length > 0) return null;
    return { ...byRole, grid_power: gridPower[0], battery_power: batteryPower[0], hasBattery: hasBatteryCounters || batteryPower.length === 1 };
}

function worstDataCompleteness(entries) {
    if (!entries.length) return 'unknown';
    let worst = 'complete';
    for (const entry of entries) {
        const severity = DATA_COMPLETENESS_SEVERITY[entry.dataCompleteness] || 0;
        if (severity > (DATA_COMPLETENESS_SEVERITY[worst] || 0)) worst = entry.dataCompleteness;
    }
    return worst;
}

function isCompletePeriodResult(result) {
    return !result || result.quality === undefined || result.quality === 'ok' || result.quality === 'complete';
}

async function residualForDay(adapter, roles, dayOffset, now) {
    const period = resolvePeriod({ dayOffset }, now);
    const totals = {};
    const qualityReasons = [];
    const readCounter = async (role, entry) => {
        const result = await computePeriodValue(adapter, entry, period);
        if (!isCompletePeriodResult(result)) qualityReasons.push(role);
        return result.total;
    };
    totals.pv_generation = await readCounter('pv_generation', roles.pv_generation);
    if (roles.grid_power) {
        const grid = await computePeriodEnergy(adapter, roles.grid_power, period);
        if (!isCompletePeriodResult(grid)) qualityReasons.push('grid_power');
        totals.grid_import = grid.positiveKwh;
        totals.grid_feed_in = grid.negativeKwh;
    } else {
        totals.grid_import = await readCounter('grid_import', roles.grid_import);
        totals.grid_feed_in = await readCounter('grid_feed_in', roles.grid_feed_in);
    }
    totals.consumption = await readCounter('consumption', roles.consumption);
    if (roles.battery_power) {
        const battery = await computePeriodEnergy(adapter, roles.battery_power, period);
        if (!isCompletePeriodResult(battery)) qualityReasons.push('battery_power');
        totals.battery_charge = battery.positiveKwh;
        totals.battery_discharge = battery.negativeKwh;
    } else {
        totals.battery_charge = roles.battery_charge ? await readCounter('battery_charge', roles.battery_charge) : 0;
        totals.battery_discharge = roles.battery_discharge ? await readCounter('battery_discharge', roles.battery_discharge) : 0;
    }
    if (qualityReasons.length || Object.values(totals).some(value => !Number.isFinite(value))) {
        return { residual: null, quality: 'gaps', qualityReasons };
    }
    return {
        residual: (totals.pv_generation + totals.grid_import + totals.battery_discharge)
            - (totals.grid_feed_in + totals.battery_charge + totals.consumption),
        quality: 'complete',
        qualityReasons,
    };
}

async function findEnergyBalanceCandidates(adapter, entries, now = Date.now()) {
    const groups = groupByDerivedMetricGroupId(entries || []);
    const candidates = [];
    let failedCount = 0;

    for (const [groupId, groupEntries] of groups) {
        const roles = resolveGroupRoles(groupEntries);
        if (!roles) continue;

        try {
            const baselineValues = [];
            const baselineQualityReasons = new Set();
            for (const dayOffset of BASELINE_DAY_OFFSETS) {
                const baseline = await residualForDay(adapter, roles, dayOffset, now);
                if (baseline.quality === 'complete' && Number.isFinite(baseline.residual)) baselineValues.push(baseline.residual);
                else baseline.qualityReasons.forEach(role => baselineQualityReasons.add(role));
            }
            const current = await residualForDay(adapter, roles, CURRENT_DAY_OFFSET, now);
            const currentValue = current.quality === 'complete' ? current.residual : null;
            let dataCompleteness = worstDataCompleteness([...REQUIRED_ROLES, ...BATTERY_ROLES, 'grid_power', 'battery_power'].map((role) => roles[role]).filter(Boolean));
            if (current.quality !== 'complete' || baselineQualityReasons.size) dataCompleteness = 'gaps';

            const evidence = detectDailyAggregateAnomaly({ currentValue, baselineValues, dataCompleteness });
            if (!evidence) continue;

            candidates.push({
                groupId,
                reason: evidence.reason === 'deviation' ? 'energy_balance_deviation' : 'energy_balance_missing_data',
                currentResidual: evidence.currentValue,
                baselineMedianResidual: evidence.baselineMedian,
                robustZ: evidence.robustZ,
                relativeChange: evidence.relativeChange,
                currentCount: evidence.currentCount,
                baselineCount: evidence.baselineCount,
                dataCompleteness: evidence.dataCompleteness,
                quality: evidence.dataCompleteness === 'complete' ? 'complete' : 'uncertain',
                hasBattery: roles.hasBattery,
                pvSourceId: roles.pv_generation.sourceId,
                pvDescription: roles.pv_generation.description,
                 gridImportSourceId: (roles.grid_import || roles.grid_power).sourceId,
                 gridImportDescription: (roles.grid_import || roles.grid_power).description,
                 gridFeedInSourceId: (roles.grid_feed_in || roles.grid_power).sourceId,
                 gridFeedInDescription: (roles.grid_feed_in || roles.grid_power).description,
                 consumptionSourceId: roles.consumption.sourceId,
                 consumptionDescription: roles.consumption.description,
                 qualityReasons: [...new Set([...baselineQualityReasons, ...current.qualityReasons])],
            });
        } catch (error) {
            failedCount++;
            if (adapter.log && adapter.log.warn) {
                adapter.log.warn(`Energiebilanz fuer Gruppe '${groupId}' fehlgeschlagen: ${error.message}`);
            }
        }
    }

    return { candidates, failedCount };
}

module.exports = { findEnergyBalanceCandidates };
