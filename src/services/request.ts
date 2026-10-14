import { API_DELAY_MS, NETWORK_FAILURE_RATES, STORAGE_KEYS } from '../config';
import { ApiError } from './errors';
import { notifyDataChanged } from './events';

export type NetworkMode = keyof typeof NETWORK_FAILURE_RATES;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const isNetworkMode = (value: string | null): value is NetworkMode =>
  value !== null && Object.hasOwn(NETWORK_FAILURE_RATES, value);

export function getNetworkMode(): NetworkMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.networkMode);
    return isNetworkMode(stored) ? stored : 'normal';
  } catch {
    return 'normal';
  }
}

/** Switches the simulated network and refetches what's on screen, so the effect is visible at once. */
export function setNetworkMode(mode: NetworkMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.networkMode, mode);
  } catch {
    // Ignore: the setting simply won't persist.
  }
  notifyDataChanged();
}

/**
 * Simulates a network round trip around a synchronous handler:
 * random latency, a failure rate set by the demo network mode, and a deep copy
 * of the response so callers can never mutate the "server" state directly.
 */
export async function request<T>(handler: () => T): Promise<T> {
  await sleep(randomBetween(API_DELAY_MS.min, API_DELAY_MS.max));

  if (Math.random() < NETWORK_FAILURE_RATES[getNetworkMode()]) {
    throw new ApiError('Could not reach the server. Please try again.', 'NETWORK');
  }

  return structuredClone(handler());
}
