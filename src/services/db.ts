import { STORAGE_KEYS } from '../config';
import type { Appointment, Doctor, Patient } from '../types/domain';
import { notifyDataChanged } from './events';
import { createSeedData } from './seed';

export interface Database {
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
}

let cache: Database | null = null;

function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== 'object') return false;
  const db = value as Record<string, unknown>;
  return Array.isArray(db.doctors) && Array.isArray(db.patients) && Array.isArray(db.appointments);
}

function persist(db: Database): void {
  try {
    localStorage.setItem(STORAGE_KEYS.database, JSON.stringify(db));
  } catch {
    // Storage full or unavailable (e.g. private mode): keep working in memory.
  }
}

function load(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.database);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (isDatabase(parsed)) return parsed;
  } catch {
    // Corrupted JSON: fall through and reseed.
  }
  const seeded = createSeedData(new Date());
  persist(seeded);
  return seeded;
}

export function readDb(): Database {
  cache ??= load();
  return cache;
}

/**
 * Applies `recipe` to a copy of the database and persists it.
 * If the recipe throws, nothing is saved, so a write either fully happens or doesn't.
 */
export function writeDb<T>(recipe: (draft: Database) => T): T {
  const draft = structuredClone(readDb());
  const result = recipe(draft);
  cache = draft;
  persist(draft);
  notifyDataChanged();
  return result;
}

export function resetDb(): void {
  cache = createSeedData(new Date());
  persist(cache);
  notifyDataChanged();
}

// Keep multiple open tabs in sync.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEYS.database) {
    cache = null;
    notifyDataChanged();
  }
});
