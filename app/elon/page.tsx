import { fetchElonMuskVideos } from '../lib/youtube';
import InterestManager from '../components/InterestManager';
import ThemeToggle from '../components/ThemeToggle';
import AppShell from '../components/AppShell';
import ElonMuskManager from '../components/ElonMuskManager';

export const revalidate = 1800; // Revalidate every 30 minutes

export default async function ElonPage() {
    const initialVideos = await fetchElonMuskVideos('all', '', 24);

    return (
        <AppShell
            sidebar={<InterestManager />}
            themeToggle={<ThemeToggle />}
            isEmpty={false}
        >
            <ElonMuskManager initialVideos={initialVideos} />
        </AppShell>
    );
}
