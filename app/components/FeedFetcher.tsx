
import { getPersonalizedFeed, getChannelVideos, searchCategoryVideos } from '../lib/youtube';
import { UserInterests, Video, Channel } from '../lib/types';
import { getStoredInterests } from '../lib/storage';
import InfiniteVideoFeed from './InfiniteVideoFeed';
import CategoryTabs from './CategoryTabs';
import TabVideoSearch from './TabVideoSearch';
import { ABUNDANCE_CHANNEL, ABUNDANCE_FEED_ID } from '../lib/curatedFeeds';

interface FeedFetcherProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function FeedFetcher({ searchParams }: FeedFetcherProps) {
    const channelIdFilter = searchParams.channelId as string | undefined;
    let categoryIdFilter = searchParams.categoryId as string | undefined;
    const searchQuery = searchParams.q as string | undefined;
    const isAbundanceFeed = categoryIdFilter === ABUNDANCE_FEED_ID;

    // Fetch initial interests from server-side storage
    const interests: UserInterests = await getStoredInterests();
    const hasInterests = interests.channels.length > 0;

    // Find focus category if available (case-insensitive name check "focus")
    const focusCategory = interests.categories?.find(c => c.name.trim().toLowerCase() === 'focus');

    // Default to focus category when loading application (no explicit categoryId or channelId filter)
    if (!channelIdFilter && !categoryIdFilter && focusCategory) {
        categoryIdFilter = focusCategory.id;
    }

    let initialVideos: Video[] = [];
    let feedTitle = "Your Personalized Feed";
    let feedType: 'home' | 'channel' | 'category' = 'home';
    let channelId: string | undefined;
    let categoryId: string | undefined;
    let initialPageToken: string | undefined;
    let initialChannelTokens: Record<string, string | undefined> | undefined;

    // Determine current feed scope name and channel list for in-tab search
    let scopeName = "Home Feed";
    let scopeChannels: Channel[] = interests.channels;

    if (isAbundanceFeed) {
        scopeName = ABUNDANCE_CHANNEL.title;
        scopeChannels = [ABUNDANCE_CHANNEL];
    } else if (channelIdFilter) {
        const ch = interests.channels.find(c => c.id === channelIdFilter);
        scopeName = ch ? ch.title : "Channel";
        scopeChannels = ch ? [ch] : [{ id: channelIdFilter, title: 'Channel' }];
    } else if (categoryIdFilter && categoryIdFilter !== 'all') {
        const cat = interests.categories?.find(c => c.id === categoryIdFilter);
        scopeName = cat ? cat.name : "Category";
        scopeChannels = cat ? interests.channels.filter(c => cat.channelIds.includes(c.id)) : [];
    } else {
        scopeName = "Home (All Categories)";
        scopeChannels = interests.channels;
    }

    if (hasInterests || isAbundanceFeed) {
        if (searchQuery && searchQuery.trim()) {
            // Search Mode: Query YouTube API filtered by channels in current tab scope
            feedTitle = `Search results for "${searchQuery}" in ${scopeName}`;
            const searchResult = await searchCategoryVideos(scopeChannels, searchQuery);
            initialVideos = searchResult.videos;
            initialPageToken = undefined;
        } else if (isAbundanceFeed) {
            feedTitle = `Videos from ${ABUNDANCE_CHANNEL.title}`;
            feedType = 'channel';
            channelId = ABUNDANCE_CHANNEL.id;
            const result = await getChannelVideos(ABUNDANCE_CHANNEL.id, 20);
            initialVideos = result.videos;
            initialPageToken = result.nextPageToken;
        } else if (channelIdFilter) {
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
                feedType = 'channel';
                channelId = channelIdFilter;
                const result = await getChannelVideos(channelIdFilter, 20);
                initialVideos = result.videos;
                initialPageToken = result.nextPageToken;
                feedTitle = "Channel Videos";
            }
        } else if (categoryIdFilter && categoryIdFilter !== 'all') {
            // Filter by Category
            const category = interests.categories?.find(c => c.id === categoryIdFilter);
            if (category) {
                feedTitle = `Videos from ${category.name}`;
                feedType = 'category';
                categoryId = category.id;
                const categoryChannels = interests.channels.filter(c => category.channelIds.includes(c.id));
                if (categoryChannels.length > 0) {
                    const result = await getPersonalizedFeed(categoryChannels, 20);
                    initialVideos = result.videos;
                    initialChannelTokens = result.channelTokens;
                    initialPageToken = result.hasMore ? JSON.stringify(result.channelTokens) : undefined;
                }
            } else {
                feedType = 'category';
                categoryId = categoryIdFilter;
                feedTitle = "Category Videos";
            }
        } else {
            // Home (Combined Feed)
            feedType = 'home';
            const result = await getPersonalizedFeed(interests.channels, 20);
            initialVideos = result.videos;
            initialChannelTokens = result.channelTokens;
            initialPageToken = result.hasMore ? JSON.stringify(result.channelTokens) : undefined;
        }
    }

    return (
        <div>
            {(interests.categories?.length > 0 || isAbundanceFeed) && (
                <CategoryTabs categories={interests.categories} />
            )}
            
            {hasInterests && (
                <TabVideoSearch
                    scopeName={scopeName}
                    channelCount={scopeChannels.length}
                    initialQuery={searchQuery}
                />
            )}

            <InfiniteVideoFeed
                initialVideos={initialVideos}
                title={feedTitle}
                feedType={feedType}
                channelId={channelId}
                categoryId={categoryId}
                initialPageToken={initialPageToken}
                initialChannelTokens={initialChannelTokens}
                searchQuery={searchQuery}
            />
        </div>
    );
}
