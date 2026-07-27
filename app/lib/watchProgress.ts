export interface WatchProgress {
    videoId: string;
    seconds: number;
    duration?: number; // total duration in seconds if known
    updatedAt: number;
}

const STORAGE_KEY = 'mytube-watch-progress';

export function getWatchProgressMap(): Record<string, WatchProgress> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.error('Error reading watch progress from localStorage:', e);
        return {};
    }
}

export function getWatchProgress(videoId: string): WatchProgress | null {
    const map = getWatchProgressMap();
    return map[videoId] || null;
}

export function saveWatchProgress(videoId: string, seconds: number, duration?: number) {
    if (typeof window === 'undefined' || !videoId) return;
    try {
        const map = getWatchProgressMap();

        // If watched > 95% of duration, or within last 10s of video, or less than 5 seconds, clear or reset progress
        if (duration && (seconds >= duration * 0.95 || duration - seconds < 10)) {
            delete map[videoId];
        } else if (seconds < 5) {
            delete map[videoId];
        } else {
            map[videoId] = {
                videoId,
                seconds: Math.floor(seconds),
                duration,
                updatedAt: Date.now(),
            };
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
        window.dispatchEvent(new Event('mytube-watch-progress-updated'));
    } catch (e) {
        console.error('Error saving watch progress:', e);
    }
}

export function clearWatchProgress(videoId: string) {
    if (typeof window === 'undefined' || !videoId) return;
    try {
        const map = getWatchProgressMap();
        delete map[videoId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
        window.dispatchEvent(new Event('mytube-watch-progress-updated'));
    } catch (e) {
        console.error('Error clearing watch progress:', e);
    }
}

export function parseIsoDurationToSeconds(duration?: string): number {
    if (!duration) return 0;
    const matches = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!matches) return 0;
    const hours = matches[1] ? parseInt(matches[1].replace('H', ''), 10) : 0;
    const minutes = matches[2] ? parseInt(matches[2].replace('M', ''), 10) : 0;
    const seconds = matches[3] ? parseInt(matches[3].replace('S', ''), 10) : 0;
    return hours * 3600 + minutes * 60 + seconds;
}

export function formatSecondsToTimestamp(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}
