const { expect } = require('chai');
const { integratePower } = require('../../lib/powerIntegration');

describe('integratePower', () => {
    it('integrates a constant kW signal with the trapezoid rule', () => {
        const result = integratePower([{ ts: 0, val: 12 }, { ts: 10 * 60 * 1000, val: 12 }]);
        expect(result).to.include({ positiveKwh: 2, negativeKwh: 0, quality: 'complete', integratedIntervals: 1, skippedIntervals: 0 });
    });

    it('splits positive import and negative export energy', () => {
        const result = integratePower([{ ts: 0, val: 2 }, { ts: 10 * 60 * 1000, val: 2 }, { ts: 20 * 60 * 1000, val: -2 }, { ts: 30 * 60 * 1000, val: -2 }]);
        expect(result.positiveKwh).to.equal(1 / 3);
        expect(result.negativeKwh).to.equal(1 / 3);
    });

    it('normalizes W to kW and supports inverted signs', () => {
        const result = integratePower([{ ts: 0, val: 6000 }, { ts: 10 * 60 * 1000, val: 6000 }], { conversionFactor: 0.001, inverted: true });
        expect(result.negativeKwh).to.equal(1);
    });

    it('skips long gaps instead of interpolating them', () => {
        const result = integratePower([{ ts: 0, val: 1 }, { ts: 16 * 60 * 1000, val: 1 }]);
        expect(result).to.include({ quality: 'gaps', integratedIntervals: 0, skippedIntervals: 1 });
        expect(result.positiveKwh).to.equal(0);
    });

    it('marks invalid raw points as gaps', () => {
        const result = integratePower([{ ts: 0, val: 1 }, { ts: 1, val: 'not-a-number' }]);
        expect(result.quality).to.equal('gaps');
    });
});
