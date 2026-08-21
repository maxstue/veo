import type { Draft } from 'immer';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { StoreApi } from 'zustand/vanilla';

type ImmerSetter<T extends object> = (
  nextStateOrUpdater:
    | Exclude<T, (...args: unknown[]) => unknown>
    | Partial<Exclude<T, (...args: unknown[]) => unknown>>
    | ((state: Draft<Exclude<T, (...args: unknown[]) => unknown>>) => void),
  shouldReplace?: false,
  actionType?: string | { type: string },
) => void;

export function createStoreFactory<T extends object>(
  storeName: string,
  store: (set: ImmerSetter<T>, get: StoreApi<T>['getState']) => T,
) {
  return create<T>()(devtools(immer(store), { enabled: import.meta.env.DEV, name: 'veo', store: `veo/${storeName}` }));
}
