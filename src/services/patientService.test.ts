import { beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from './db';
import { patientService } from './patientService';

beforeEach(() => {
  resetDb();
});

describe('patientService.list', () => {
  it('matches by name (case-insensitive) or by partial phone number', async () => {
    expect((await patientService.list({ search: 'PRIYA' })).map((p) => p.name)).toEqual(['Priya Sharma']);
    expect((await patientService.list({ search: '98765 432' })).map((p) => p.name)).toEqual(['Priya Sharma']);
    expect(await patientService.list({ search: 'zzz' })).toEqual([]);
  });

  it('sorts by name, most recent visit, or balance due', async () => {
    const byName = await patientService.list({ sort: 'name' });
    expect(byName.map((p) => p.name)).toEqual([...byName.map((p) => p.name)].sort((a, b) => a.localeCompare(b)));

    const recent = await patientService.list({ sort: 'recent' });
    const visited = recent.filter((p) => p.lastVisit);
    expect(visited.map((p) => p.lastVisit)).toEqual([...visited.map((p) => p.lastVisit)].sort().reverse());
    // Patients without visits come last.
    expect(recent.slice(visited.length).every((p) => p.lastVisit === null)).toBe(true);

    const balances = (await patientService.list({ sort: 'balance' })).map((p) => p.balanceDue);
    expect(balances).toEqual([...balances].sort((a, b) => b - a));
    expect(balances[0]).toBeGreaterThan(0);
  });
});
