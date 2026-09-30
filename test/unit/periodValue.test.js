const { expect } = require('chai');
const proxyquire = require('proxyquire');

function load(getHistory, timeZone = 'UTC') {
    return proxyquire('../../lib/periodValue', {
        './dataAccess': { getHistory },
        './promptContext': {
            getLocalTimeZone: () => timeZone,
            getLocalDayBoundaries: value => ({ start: value, end: value + 86400000 }),
            shiftLocalCalendarDay: (value, offset) => value + offset * 86400000,
        },
    });
}

describe('periodValue', () => {
    it('counts cumulative counter increments across a reset', async () => {
        const getHistory = async (_adapter, _instance, _source, start) => start < 0
            ? [{ ts: -1, val: 100 }]
            : [{ ts: 1, val: 110 }, { ts: 2, val: 10 }, { ts: 3, val: 30 }];
        const { computePeriodValue } = load(getHistory);

        const result = await computePeriodValue({}, { historyInstance: 'history.0', sourceId: 'meter.0.total', valueKind: 'cumulative_total' }, { start: 0, end: 10 });

        expect(result).to.include({ total: 40, quality: 'uncertain' });
        expect(result.resets).to.have.lengthOf(1);
    });

    it('rejects an incomplete cumulative counter history instead of trusting buckets', async () => {
        const getHistory = async () => {
            const points = [{ ts: 1, val: 100 }];
            Object.defineProperty(points, 'truncated', { value: true });
            return points;
        };
        const { computePeriodValue } = load(getHistory);

        let error;
        try {
            await computePeriodValue({}, { historyInstance: 'history.0', sourceId: 'meter.0.total', valueKind: 'cumulative_total' }, { start: 0, end: 10 });
        } catch (caught) {
            error = caught;
        }

        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.include('unvollstaendig');
    });

    it('counts resets even when history returns raw changes', async () => {
        const getHistory = async (_adapter, _instance, _source, start) => start < 0
            ? [{ ts: -1, val: 90 }]
            : [{ ts: 1, val: 100 }, { ts: 2, val: 20 }, { ts: 3, val: 30 }];
        const { computePeriodValue } = load(getHistory);

        const result = await computePeriodValue({}, { historyInstance: 'history.0', sourceId: 'meter.0.total', valueKind: 'cumulative_total' }, { start: 0, end: 10 });

        expect(result).to.include({ total: 40, quality: 'uncertain' });
    });

    it('groups daily counters by the configured local calendar day', async () => {
        const getHistory = async () => [
            { ts: Date.parse('2026-01-01T23:30:00Z'), max: 10 },
            { ts: Date.parse('2026-01-02T00:30:00Z'), max: 20 },
        ];
        const { computePeriodValue } = load(getHistory, 'Europe/Berlin');

        const result = await computePeriodValue({}, { historyInstance: 'history.0', sourceId: 'meter.0.daily', valueKind: 'daily_reset_counter' }, { start: Date.parse('2026-01-01T00:00:00Z'), end: Date.parse('2026-01-03T00:00:00Z') });

        expect(result).to.include({ total: 20, quality: 'ok' });
    });

    it('uses only the segment after a delayed reset on the local day', async () => {
        const getHistory = async () => [
            { ts: Date.parse('2026-09-29T00:05:00Z'), max: 27.63 },
            { ts: Date.parse('2026-09-29T00:10:00Z'), max: 0.02 },
            { ts: Date.parse('2026-09-29T12:00:00Z'), max: 26.21 },
        ];
        const { computePeriodValue } = load(getHistory, 'UTC');

        const result = await computePeriodValue({}, { historyInstance: 'influxdb.0', sourceId: 'pv.daily', valueKind: 'daily_reset_counter' }, { start: Date.parse('2026-09-29T00:00:00Z'), end: Date.parse('2026-09-30T00:00:00Z') });

        expect(result.total).to.equal(26.21);
        expect(result.quality).to.equal('ok');
        expect(result.resets).to.have.lengthOf(1);
    });

    it('normalizes Wh before evaluating an energy-role daily counter', async () => {
        const getHistory = async () => [{ ts: 1, max: 31490 }];
        const { computePeriodValue } = load(getHistory);

        const result = await computePeriodValue({}, { historyInstance: 'influxdb.0', sourceId: 'meter.daily', unit: 'Wh', valueKind: 'daily_reset_counter', derivedMetricRole: 'consumption' }, { start: 0, end: 10 });

        expect(result).to.include({ total: 31.49, normalizedUnit: 'kWh', conversionFactor: 0.001 });
    });

    it('marks multiple daily resets as uncertain', async () => {
        const getHistory = async () => [
            { ts: 1, max: 10 }, { ts: 2, max: 0 }, { ts: 3, max: 5 }, { ts: 4, max: 0 }, { ts: 5, max: 2 },
        ];
        const { computePeriodValue } = load(getHistory);

        const result = await computePeriodValue({}, { historyInstance: 'history.0', sourceId: 'pv.daily', valueKind: 'daily_reset_counter' }, { start: 0, end: 10 });

        expect(result.total).to.equal(2);
        expect(result.quality).to.equal('uncertain');
        expect(result.resets).to.have.lengthOf(2);
    });

    it('shifts dayOffset by local calendar date rather than fixed milliseconds', () => {
        const { resolvePeriod } = load(async () => []);
        const period = resolvePeriod({ dayOffset: -1 }, Date.parse('2026-03-30T12:00:00Z'));

        expect(period.start).to.equal(Date.parse('2026-03-29T12:00:00Z'));
    });

    it('uses the state before the period for an already active boolean', async () => {
        const getHistory = async () => [{ ts: -1, val: 'true' }, { ts: 5, val: 'false' }];
        const { computePeriodValue } = load(getHistory);

        const result = await computePeriodValue({}, { historyInstance: 'history.0', sourceId: 'switch.0.state', valueKind: 'boolean_state' }, { start: 0, end: 10 });

        expect(result).to.deep.equal({ onDurationMs: 5, switchCount: 1 });
    });

    it('does not treat named text states as numeric gauges', async () => {
        const { computePeriodValue } = load(async () => [{ ts: 1, val: 'heating' }]);

        let error;
        try {
            await computePeriodValue({}, { historyInstance: 'history.0', sourceId: 'heating.0.mode', valueKind: 'enum_state' }, { start: 0, end: 10 });
        } catch (caught) {
            error = caught;
        }

        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.include('nicht numerisch');
    });
});
