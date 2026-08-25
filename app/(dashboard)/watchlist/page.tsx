import { getWatchlistVideos } from '../../lib/storage';
import WatchlistManager from '../../components/WatchlistManager';

export const revalidate = 0; // Dynamic server rendering

export default async function WatchlistPage() {
    const watchlistVideos = await getWatchlistVideos();

    return <WatchlistManager initialWatchlist={watchlistVideos} />;
}
