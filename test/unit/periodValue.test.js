const { expect } = require('chai');
const proxyquire = require('proxyquire');

function load(getHistory, timeZone = 'UTC') {
    return proxyquire('../../lib/periodValue', {
        './dataAccess': { getHistory },
        './promptContext': {
            getLocalTimeZone: () => timeZone,
            getLocalDayBoundaries: value => ({ start: value, end: value + 86400000 }),
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

        expect(result).to.deep.equal({ total: 40 });
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

        expect(result).to.deep.equal({ total: 40 });
    });

    it('groups daily counters by the configured local calendar day', async () => {
        const getHistory = async () => [
            { ts: Date.parse('2026-01-01T23:30:00Z'), max: 10 },
            { ts: Date.parse('2026-01-02T00:30:00Z'), max: 20 },
        ];
        const { computePeriodValue } = load(getHistory, 'Europe/Berlin');

        const result = await computePeriodValue({}, { historyInstance: 'history.0', sourceId: 'meter.0.daily', valueKind: 'daily_reset_counter' }, { start: Date.parse('2026-01-01T00:00:00Z'), end: Date.parse('2026-01-03T00:00:00Z') });

        expect(result).to.deep.equal({ total: 20 });
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
