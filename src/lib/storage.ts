import { get, set, del } from 'idb-keyval'

export async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await get(key)
    return raw !== undefined ? (raw as T) : fallback
  } catch {
    // Fallback to localStorage if IndexedDB fails
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  }
}

export async function save<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value)
  } catch {
    // Fallback to localStorage
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.error('Storage write failed for key:', key)
    }
  }
}

export async function remove(key: string): Promise<void> {
  try {
    await del(key)
  } catch {
    localStorage.removeItem(key)
  }
}
