const { expect } = require('chai');
const { canonicalUnit, getUnitSpec, normalizeValue } = require('../../lib/unitNormalization');

describe('unitNormalization', () => {
    it('canonicalizes supported unit spellings', () => {
        expect(canonicalUnit(' kWh ')).to.equal('kwh');
        expect(canonicalUnit('W')).to.equal('w');
    });

    it('normalizes Wh energy roles to kWh', () => {
        const spec = getUnitSpec({ unit: 'Wh', derivedMetricRole: 'consumption' });
        expect(spec).to.deep.equal({ sourceUnit: 'Wh', normalizedUnit: 'kWh', conversionFactor: 0.001 });
        expect(normalizeValue(31490, spec)).to.equal(31.49);
    });

    it('normalizes W power roles to kW', () => {
        const spec = getUnitSpec({ unit: 'W', derivedMetricRole: 'grid_power' });
        expect(spec.normalizedUnit).to.equal('kW');
        expect(normalizeValue(1500, spec)).to.equal(1.5);
    });

    it('rejects missing or incompatible units for energy roles', () => {
        expect(() => getUnitSpec({ derivedMetricRole: 'pv_generation' })).to.throw('Energieeinheit');
        expect(() => getUnitSpec({ unit: 'kW', derivedMetricRole: 'pv_generation' })).to.throw('Energieeinheit');
    });

    it('does not infer units for entries without a typed energy role', () => {
        expect(getUnitSpec({ unit: 'mm', valueKind: 'gauge' })).to.deep.equal({ sourceUnit: 'mm', normalizedUnit: 'mm', conversionFactor: 1 });
    });
});
