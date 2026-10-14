export const CLINIC_NAME = 'CareWell Clinic';

export const LOCALE = 'en-IN';
export const CURRENCY = 'INR';

/** Range of artificial latency added to every mock API call. */
export const API_DELAY_MS = { min: 250, max: 650 } as const;

/** Demo network modes (sidebar) and the share of mock API calls that fail in each. */
export const NETWORK_FAILURE_RATES = { normal: 0, flaky: 0.3, offline: 1 } as const;

/** How often live views (queue, dashboard) refresh their clock-based estimates. */
export const LIVE_REFRESH_MS = 30_000;

export const STORAGE_KEYS = {
  database: 'carewell:db:v1',
  networkMode: 'carewell:network-mode',
} as const;
