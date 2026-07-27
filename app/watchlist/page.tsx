import { getWatchlistVideos, getStoredInterests } from '../lib/storage';
import InterestManager from '../components/InterestManager';
import ThemeToggle from '../components/ThemeToggle';
import AppShell from '../components/AppShell';
import WatchlistManager from '../components/WatchlistManager';

export const revalidate = 0; // Dynamic server rendering

export default async function WatchlistPage() {
    const watchlistVideos = await getWatchlistVideos();
    const interests = await getStoredInterests();
    const hasInterests = interests.channels.length > 0;

    return (
        <AppShell
            sidebar={<InterestManager />}
            themeToggle={<ThemeToggle />}
            isEmpty={false}
        >
            <WatchlistManager initialWatchlist={watchlistVideos} />
        </AppShell>
    );
}
