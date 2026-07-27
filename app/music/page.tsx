import { getMusicListVideos, getStoredInterests } from '../lib/storage';
import InterestManager from '../components/InterestManager';
import ThemeToggle from '../components/ThemeToggle';
import AppShell from '../components/AppShell';
import MusicManager from '../components/MusicManager';

export const revalidate = 0; // Dynamic server rendering

export default async function MusicPage() {
    const musicListVideos = await getMusicListVideos();
    const interests = await getStoredInterests();
    const hasInterests = interests.channels.length > 0;

    return (
        <AppShell
            sidebar={<InterestManager />}
            themeToggle={<ThemeToggle />}
            isEmpty={false}
        >
            <MusicManager initialMusicList={musicListVideos} />
        </AppShell>
    );
}
