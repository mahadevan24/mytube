
import { getPersonalizedFeed, getChannelVideos } from '../lib/youtube';
import { UserInterests, Video } from '../lib/types';
import { getStoredInterests } from '../lib/storage';
import InfiniteVideoFeed from './InfiniteVideoFeed';

interface FeedFetcherProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function FeedFetcher({ searchParams }: FeedFetcherProps) {
    const channelIdFilter = searchParams.channelId as string | undefined;

    // Fetch initial interests from server-side storage
    const interests: UserInterests = await getStoredInterests();

    const hasInterests = interests.channels.length > 0;

    let initialVideos: Video[] = [];
    let feedTitle = "Your Personalized Feed";
    let feedType: 'home' | 'channel' = 'home';
    let channelId: string | undefined;
    let initialPageToken: string | undefined;
    let initialChannelTokens: Record<string, string | undefined> | undefined;

    if (hasInterests) {
        if (channelIdFilter) {
            // Filter by Channel
            const channel = interests.channels.find(c => c.id === channelIdFilter);
            if (channel) {
                feedTitle = `Videos from ${channel.title}`;
                feedType = 'channel';
                channelId = channel.id;
                const result = await getChannelVideos(channel.id, 20);
                initialVideos = result.videos;
                initialPageToken = result.nextPageToken;
            } else {
                // Channel not in interests (or invalid ID), fallback to home or empty
                feedType = 'channel';
                channelId = channelIdFilter;
                const result = await getChannelVideos(channelIdFilter, 20);
                initialVideos = result.videos;
                initialPageToken = result.nextPageToken;
                feedTitle = "Channel Videos";
            }
        } else {
            // Home (Combined Feed)
            feedType = 'home';
            const result = await getPersonalizedFeed(interests.channels, 20);
            initialVideos = result.videos;
            initialChannelTokens = result.channelTokens;
            // For home feed, nextPageToken is the channelTokens JSON string
            initialPageToken = result.hasMore ? JSON.stringify(result.channelTokens) : undefined;
        }
    }

    return (
        <InfiniteVideoFeed
            initialVideos={initialVideos}
            title={feedTitle}
            feedType={feedType}
            channelId={channelId}
            initialPageToken={initialPageToken}
            initialChannelTokens={initialChannelTokens}
        />
    );
}
