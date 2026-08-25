'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getWatchProgressMap, WatchProgress } from '../lib/watchProgress';

const WatchProgressContext = createContext<Record<string, WatchProgress>>({});

export function WatchProgressProvider({ children }: { children: React.ReactNode }) {
    const [progressMap, setProgressMap] = useState<Record<string, WatchProgress>>({});

    useEffect(() => {
        const refreshProgress = () => setProgressMap(getWatchProgressMap());
        refreshProgress();
        window.addEventListener('mytube-watch-progress-updated', refreshProgress);
        window.addEventListener('storage', refreshProgress);
        return () => {
            window.removeEventListener('mytube-watch-progress-updated', refreshProgress);
            window.removeEventListener('storage', refreshProgress);
        };
    }, []);

    return (
        <WatchProgressContext.Provider value={progressMap}>
            {children}
        </WatchProgressContext.Provider>
    );
}

export function useWatchProgress(videoId: string): WatchProgress | null {
    return useContext(WatchProgressContext)[videoId] || null;
}
