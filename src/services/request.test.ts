import { afterEach, describe, expect, it, vi } from 'vitest';
import { onDataChanged } from './events';
import { getNetworkMode, request, setNetworkMode } from './request';

afterEach(() => {
  setNetworkMode('normal');
});

describe('simulated network', () => {
  it('defaults to normal, where requests succeed and return a copy', async () => {
    expect(getNetworkMode()).toBe('normal');
    const source = { token: 1 };
    const result = await request(() => source);
    expect(result).toEqual(source);
    expect(result).not.toBe(source);
  });

  it('fails every request when offline, without running the handler', async () => {
    setNetworkMode('offline');
    const handler = vi.fn(() => 'saved');
    await expect(request(handler)).rejects.toMatchObject({ name: 'ApiError', code: 'NETWORK' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('refetches visible data as soon as the mode changes', () => {
    const listener = vi.fn();
    const unsubscribe = onDataChanged(listener);
    setNetworkMode('flaky');
    expect(listener).toHaveBeenCalledOnce();
    expect(getNetworkMode()).toBe('flaky');
    unsubscribe();
  });

  it('ignores an unknown stored value', () => {
    localStorage.setItem('carewell:network-mode', 'bogus');
    expect(getNetworkMode()).toBe('normal');
  });
});
