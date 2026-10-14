type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to "data changed" notifications; returns an unsubscribe function. */
export function onDataChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyDataChanged(): void {
  listeners.forEach((listener) => listener());
}
