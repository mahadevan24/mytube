import { getMusicListVideos } from '../../lib/storage';
import MusicManager from '../../components/MusicManager';

export const revalidate = 0; // Dynamic server rendering

export default async function MusicPage() {
    const musicListVideos = await getMusicListVideos();

    return <MusicManager initialMusicList={musicListVideos} />;
}
