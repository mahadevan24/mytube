
import { getPersonalizedFeed, getChannelVideos } from '../lib/youtube';
import { UserInterests, Video } from '../lib/types';
import { getStoredInterests } from '../lib/storage';
import VideoFeed from './VideoFeed';

interface FeedFetcherProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function FeedFetcher({ searchParams }: FeedFetcherProps) {
    const channelIdFilter = searchParams.channelId as string | undefined;

    // Fetch initial interests from server-side storage
    const interests: UserInterests = await getStoredInterests();

    const hasInterests = interests.channels.length > 0;

    let videos: Video[] = [];
    let feedTitle = "Your Personalized Feed";

    if (hasInterests) {
        if (channelIdFilter) {
            // Filter by Channel
            const channel = interests.channels.find(c => c.id === channelIdFilter);
            if (channel) {
                feedTitle = `Videos from ${channel.title}`;
                videos = await getChannelVideos(channel.id, 20);
            } else {
                // Channel not in interests (or invalid ID), fallback to home or empty
                videos = await getChannelVideos(channelIdFilter, 20);
                feedTitle = "Channel Videos";
            }
        } else {
            // Home (Combined Feed)
            videos = await getPersonalizedFeed(interests.channels);
        }
    }

    return <VideoFeed videos={videos} title={feedTitle} />;
}
