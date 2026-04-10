export const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage.get failed:', e);
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage.set failed:', e);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage.remove failed:', e);
    }
  },
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('localStorage.clear failed:', e);
    }
  },
  getJSON: <T>(key: string): T | null => {
    const value = storage.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.warn(`localStorage.getJSON failed for key "${key}":`, e);
      return null;
    }
  },
  setJSON: (key: string, value: any): void => {
    try {
      storage.set(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`localStorage.setJSON failed for key "${key}":`, e);
    }
  }
};
