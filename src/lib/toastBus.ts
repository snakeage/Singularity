type ToastListener = (message: string) => void;

const listeners = new Set<ToastListener>();

export function pushToast(message: string): void {
  for (const listener of listeners) listener(message);
}

export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
