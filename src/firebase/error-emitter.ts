'use client';
import { FirestorePermissionError } from '@/firebase/errors';
export interface AppEvents {
  'permission-error': FirestorePermissionError;
}

type Callback<T> = (data: T) => void;

function createEventEmitter<T extends Record<string, any>>() {
  const events: { [K in keyof T]?: Array<Callback<T[K]>> } = {};

  return {
    /**
     * Subscribe to an event.
     * @param eventName The name of the event to subscribe to.
     * @param callback The function to call when the event is emitted.
     */
    on<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        events[eventName] = [];
      }
      events[eventName]?.push(callback);
    },

    /**
     * Unsubscribe from an event.
     * @param eventName The name of the event to unsubscribe from.
     * @param callback The specific callback to remove.
     */
    off<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        return;
      }
      events[eventName] = events[eventName]?.filter(cb => cb !== callback);
    },

    /**
     * Publish an event to all subscribers.
     * @param eventName The name of the event to emit.
     * @param data The data payload that corresponds to the event's type.
     */
    emit<K extends keyof T>(eventName: K, data: T[K]) {
      if (!events[eventName]) {
        return;
      }
      events[eventName]?.forEach(callback => callback(data));
    },
  };
}

export const errorEmitter = createEventEmitter<AppEvents>();

