import { getPersonalizedFeed, getChannelVideos, searchCategoryVideos } from '../lib/youtube';
import { UserInterests, Video, Channel } from '../lib/types';
import InfiniteVideoFeed from './InfiniteVideoFeed';
import { ABUNDANCE_CHANNEL, ABUNDANCE_FEED_ID } from '../lib/curatedFeeds';

export interface FeedScope {
    channelIdFilter?: string;
    categoryIdFilter?: string;
    searchQuery?: string;
    isAbundanceFeed: boolean;
    scopeName: string;
    scopeChannels: Channel[];
}

interface FeedFetcherProps {
    interests: UserInterests;
    scope: FeedScope;
}

export function resolveFeedScope(
    interests: UserInterests,
    searchParams: { [key: string]: string | string[] | undefined }
): FeedScope {
    const channelIdFilter = searchParams.channelId as string | undefined;
    let categoryIdFilter = searchParams.categoryId as string | undefined;
    const searchQuery = searchParams.q as string | undefined;
    const focusCategory = interests.categories?.find(category => category.name.trim().toLowerCase() === 'focus');

    if (!channelIdFilter && !categoryIdFilter && focusCategory) {
        categoryIdFilter = focusCategory.id;
    }

    const isAbundanceFeed = categoryIdFilter === ABUNDANCE_FEED_ID;
    let scopeName = 'Home Feed';
    let scopeChannels = interests.channels;

    if (isAbundanceFeed) {
        scopeName = ABUNDANCE_CHANNEL.title;
        scopeChannels = [ABUNDANCE_CHANNEL];
    } else if (channelIdFilter) {
        const channel = interests.channels.find(item => item.id === channelIdFilter);
        scopeName = channel?.title || 'Channel';
        scopeChannels = channel ? [channel] : [{ id: channelIdFilter, title: 'Channel' }];
    } else if (categoryIdFilter && categoryIdFilter !== 'all') {
        const category = interests.categories?.find(item => item.id === categoryIdFilter);
        scopeName = category?.name || 'Category';
        scopeChannels = category
            ? interests.channels.filter(channel => category.channelIds.includes(channel.id))
            : [];
    } else {
        scopeName = 'Home (All Categories)';
    }

    return {
        channelIdFilter,
        categoryIdFilter,
        searchQuery,
        isAbundanceFeed,
        scopeName,
        scopeChannels,
    };
}

export default async function FeedFetcher({ interests, scope }: FeedFetcherProps) {
    const {
        channelIdFilter,
        categoryIdFilter,
        searchQuery,
        isAbundanceFeed,
        scopeName,
        scopeChannels,
    } = scope;
    const hasInterests = interests.channels.length > 0;
    let initialVideos: Video[] = [];
    let feedTitle = 'Your Personalized Feed';
    let feedType: 'home' | 'channel' | 'category' = 'home';
    let channelId: string | undefined;
    let categoryId: string | undefined;
    let initialPageToken: string | undefined;
    let initialChannelTokens: Record<string, string | undefined> | undefined;

    if (hasInterests || isAbundanceFeed) {
        if (searchQuery?.trim()) {
            feedTitle = `Search results for "${searchQuery}" in ${scopeName}`;
            const searchResult = await searchCategoryVideos(scopeChannels, searchQuery);
            initialVideos = searchResult.videos.slice(0, 32);
        } else if (isAbundanceFeed) {
            feedTitle = `Videos from ${ABUNDANCE_CHANNEL.title}`;
            feedType = 'channel';
            channelId = ABUNDANCE_CHANNEL.id;
            const result = await getChannelVideos(ABUNDANCE_CHANNEL.id, 24);
            initialVideos = result.videos;
            initialPageToken = result.nextPageToken;
        } else if (channelIdFilter) {
            const channel = interests.channels.find(item => item.id === channelIdFilter);
            feedTitle = channel ? `Videos from ${channel.title}` : 'Channel Videos';
            feedType = 'channel';
            channelId = channelIdFilter;
            const result = await getChannelVideos(channelIdFilter, 24);
            initialVideos = result.videos;
            initialPageToken = result.nextPageToken;
        } else if (categoryIdFilter && categoryIdFilter !== 'all') {
            const category = interests.categories?.find(item => item.id === categoryIdFilter);
            feedTitle = category ? `Videos from ${category.name}` : 'Category Videos';
            feedType = 'category';
            categoryId = categoryIdFilter;
            if (scopeChannels.length > 0) {
                const result = await getPersonalizedFeed(scopeChannels, 5);
                initialVideos = result.videos;
                initialChannelTokens = result.channelTokens;
                initialPageToken = result.hasMore ? JSON.stringify(result.channelTokens) : undefined;
            }
        } else {
            const result = await getPersonalizedFeed(interests.channels, 5);
            initialVideos = result.videos;
            initialChannelTokens = result.channelTokens;
            initialPageToken = result.hasMore ? JSON.stringify(result.channelTokens) : undefined;
        }
    }

    return (
        <InfiniteVideoFeed
            initialVideos={initialVideos}
            title={feedTitle}
            feedType={feedType}
            channelId={channelId}
            categoryId={categoryId}
            initialPageToken={initialPageToken}
            initialChannelTokens={initialChannelTokens}
        />
    );
}
