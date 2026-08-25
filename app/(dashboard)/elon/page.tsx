import { fetchElonMuskVideos } from '../../lib/youtube';
import ElonMuskManager from '../../components/ElonMuskManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ElonPage() {
    const initialVideos = await fetchElonMuskVideos('all', '', 24);

    return <ElonMuskManager initialVideos={initialVideos} />;
}
