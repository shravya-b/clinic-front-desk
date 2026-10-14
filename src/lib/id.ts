/** Short, sortable, collision-resistant id, e.g. `pat_lq3k9x2a7f1c`. */
export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
