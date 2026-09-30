'use strict';

const ENERGY_ROLES = new Set(['pv_generation', 'consumption', 'grid_import', 'grid_feed_in', 'battery_charge', 'battery_discharge']);
const POWER_ROLES = new Set(['grid_power', 'battery_power']);

function canonicalUnit(unit) {
    return typeof unit === 'string' ? unit.trim().toLowerCase().replace(/\s+/g, '') : '';
}

function getUnitSpec(entry = {}) {
    const sourceUnit = typeof entry.unit === 'string' ? entry.unit.trim() : '';
    const role = entry.derivedMetricRole;
    const normalized = canonicalUnit(sourceUnit);

    if (!ENERGY_ROLES.has(role) && !POWER_ROLES.has(role)) {
        return { sourceUnit, normalizedUnit: sourceUnit, conversionFactor: 1 };
    }

    if (ENERGY_ROLES.has(role)) {
        if (normalized === 'kwh') return { sourceUnit, normalizedUnit: 'kWh', conversionFactor: 1 };
        if (normalized === 'wh') return { sourceUnit, normalizedUnit: 'kWh', conversionFactor: 0.001 };
        throw new Error(`Ungueltige Energieeinheit '${sourceUnit || '(fehlt)'}' fuer Rolle '${role}'. Erlaubt sind Wh oder kWh.`);
    }

    if (normalized === 'kw') return { sourceUnit, normalizedUnit: 'kW', conversionFactor: 1 };
    if (normalized === 'w') return { sourceUnit, normalizedUnit: 'kW', conversionFactor: 0.001 };
    throw new Error(`Ungueltige Leistungseinheit '${sourceUnit || '(fehlt)'}' fuer Rolle '${role}'. Erlaubt sind W oder kW.`);
}

function normalizeValue(value, unitSpec) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    const normalized = numeric * unitSpec.conversionFactor;
    // Avoid exposing binary floating-point artifacts in user-visible energy values.
    return Math.round(normalized * 1e12) / 1e12;
}

module.exports = { ENERGY_ROLES, POWER_ROLES, canonicalUnit, getUnitSpec, normalizeValue };
