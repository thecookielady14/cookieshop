import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

// True after hydration – replaces the setState-in-effect mounted pattern
export function useMounted() {
    return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
