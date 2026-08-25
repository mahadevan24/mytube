/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from 'googleapis';
import { cache } from 'react';
import { Video, Channel, MusicVideo } from './types';
import { getCurrentUser } from './auth';

const youtube = google.youtube('v3');

const getApiKey = cache(async (): Promise<string | undefined> => {
    try {
        const user = await getCurrentUser();
        if (user?.youtubeApiKey && user.youtubeApiKey.trim()) {
            return user.youtubeApiKey.trim();
        }
    } catch {
        // Fallback if executed outside request scope
    }
    return process.env.YOUTUBE_API_KEY;
});

// Initialize YouTube Client
const getYoutubeClient = () => {
    return youtube;
};

// Helper: Get Uploads Playlist ID for a Channel
async function getUploadsPlaylistId(channelId: string, apiKeyOverride?: string): Promise<string | null> {
    const yt = getYoutubeClient();
    const apiKey = apiKeyOverride ?? await getApiKey();
    try {
        const response = await yt.channels.list({
            key: apiKey,
            part: ['contentDetails'],
            id: [channelId],
        });

        const items = response.data.items;
        if (items && items.length > 0) {
            return items[0].contentDetails?.relatedPlaylists?.uploads || null;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching channel details for ${channelId}:`, error);
        return null;
    }
}

async function getUploadsPlaylistIds(
    channelIds: string[],
    apiKey?: string
): Promise<Map<string, string>> {
    const yt = getYoutubeClient();
    const uniqueIds = Array.from(new Set(channelIds));
    const chunks: string[][] = [];
    for (let i = 0; i < uniqueIds.length; i += 50) {
        chunks.push(uniqueIds.slice(i, i + 50));
    }

    try {
        const responses = await Promise.all(chunks.map(id => yt.channels.list({
            key: apiKey,
            part: ['contentDetails'],
            id,
        })));
        const playlistIds = new Map<string, string>();
        responses.forEach((response) => {
            (response.data.items || []).forEach((item: any) => {
                const uploadsId = item.contentDetails?.relatedPlaylists?.uploads;
                if (item.id && uploadsId) playlistIds.set(item.id, uploadsId);
            });
        });
        return playlistIds;
    } catch (error) {
        console.error('Error fetching uploads playlist IDs:', error);
        return new Map();
    }
}

// Fetch video details (duration) for a list of video IDs
async function getVideoDetails(
    videoIds: string[],
    apiKeyOverride?: string
): Promise<Map<string, { duration: string; viewCount?: string }>> {
    if (videoIds.length === 0) return new Map();
    const yt = getYoutubeClient();
    const apiKey = apiKeyOverride ?? await getApiKey();
    try {
        const uniqueIds = Array.from(new Set(videoIds));
        const chunks: string[][] = [];
        for (let i = 0; i < uniqueIds.length; i += 50) {
            chunks.push(uniqueIds.slice(i, i + 50));
        }

        const responses = await Promise.all(chunks.map(id => yt.videos.list({
            key: apiKey,
            part: ['contentDetails', 'statistics'],
            id,
        })));

        const detailsMap = new Map<string, { duration: string; viewCount?: string }>();
        responses.forEach((response) => {
            (response.data.items || []).forEach((item: any) => {
                if (item.id) {
                    detailsMap.set(item.id, {
                        duration: item.contentDetails?.duration,
                        viewCount: item.statistics?.viewCount,
                    });
                }
            });
        });
        return detailsMap;
    } catch (error) {
        console.error('Error fetching video details:', error);
        return new Map();
    }
}

// Fetch subscriber count for a list of channel IDs
async function getChannelsSubscriberCounts(
    channelIds: string[],
    apiKeyOverride?: string
): Promise<Map<string, number>> {
    if (channelIds.length === 0) return new Map();
    const yt = getYoutubeClient();
    const apiKey = apiKeyOverride ?? await getApiKey();
    try {
        const uniqueIds = Array.from(new Set(channelIds));
        const response = await yt.channels.list({
            key: apiKey,
            part: ['statistics'],
            id: uniqueIds,
        });

        const subscriberMap = new Map<string, number>();
        (response.data.items || []).forEach((item: any) => {
            if (item.id && item.statistics) {
                const count = parseInt(item.statistics.subscriberCount || '0', 10);
                subscriberMap.set(item.id, isNaN(count) ? 0 : count);
            }
        });
        return subscriberMap;
    } catch (error) {
        console.error('Error fetching channel subscriber counts:', error);
        return new Map();
    }
}

// Helper to check if duration is too short (< 5 mins)
function isTooShort(durationIso?: string): boolean {
    if (!durationIso) return false;
    const matches = durationIso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!matches) return false;

    const hours = parseInt(matches[1]?.replace('H', '') || '0', 10);
    const minutes = parseInt(matches[2]?.replace('M', '') || '0', 10);
    const seconds = parseInt(matches[3]?.replace('S', '') || '0', 10);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds < 300;
}

export interface ChannelVideosResponse {
    videos: Video[];
    nextPageToken?: string;
    hasMore: boolean;
}

export async function getChannelVideos(
    channelId: string, 
    maxResults = 20, 
    pageToken?: string
): Promise<ChannelVideosResponse> {
    const yt = getYoutubeClient();
    const apiKey = await getApiKey();
    const uploadsPlaylistId = await getUploadsPlaylistId(channelId, apiKey);

    if (!uploadsPlaylistId) {
        return { videos: [], hasMore: false };
    }

    try {
        const fetchLimit = Math.min(50, Math.max(maxResults * 2, 10));

        const response = await yt.playlistItems.list({
            key: apiKey,
            part: ['snippet', 'contentDetails'],
            playlistId: uploadsPlaylistId,
            maxResults: fetchLimit,
            pageToken: pageToken,
        });

        const items = response.data.items || [];
        const nextPageToken = response.data.nextPageToken;
        const videoIds = items.map((item: any) => item.contentDetails?.videoId).filter(Boolean);

        const detailsMap = await getVideoDetails(videoIds, apiKey);

        const videos: Video[] = items
            .map((item: any) => {
                const videoId = item.contentDetails?.videoId;
                const details = detailsMap.get(videoId);
                return {
                    id: videoId || '',
                    title: item.snippet?.title || '',
                    thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
                    channelTitle: item.snippet?.channelTitle || '',
                    publishedAt: item.snippet?.publishedAt || '',
                    channelId: channelId,
                    duration: details?.duration,
                    viewCount: details?.viewCount,
                };
            })
            .filter((v: Video) => v.id && !isTooShort(v.duration));

        return {
            videos: videos.slice(0, maxResults),
            nextPageToken: nextPageToken || undefined,
            hasMore: !!nextPageToken,
        };
    } catch (error) {
        console.error(`Error fetching uploads for channel ${channelId}:`, error);
        return { videos: [], hasMore: false };
    }
}

export async function getChannelVideosLegacy(channelId: string, maxResults = 10): Promise<Video[]> {
    const result = await getChannelVideos(channelId, maxResults);
    return result.videos;
}

export interface PersonalizedFeedResponse {
    videos: Video[];
    channelTokens: Record<string, string | undefined>;
    hasMore: boolean;
}

export async function getPersonalizedFeed(
    channels: Channel[],
    maxResultsPerChannel = 5,
    channelTokens?: Record<string, string | undefined>,
    maxTotalResults = 32
): Promise<PersonalizedFeedResponse> {
    if (channels.length === 0) {
        return { videos: [], channelTokens: {}, hasMore: false };
    }

    const yt = getYoutubeClient();
    const apiKey = await getApiKey();
    const playlistIds = await getUploadsPlaylistIds(channels.map(c => c.id), apiKey);
    const fetchLimit = Math.min(50, Math.max(maxResultsPerChannel * 2, 10));

    const rawChannelResults = await Promise.all(channels.map(async (channel) => {
        const playlistId = playlistIds.get(channel.id);
        if (!playlistId) {
            return { channelId: channel.id, items: [] as any[], nextPageToken: undefined };
        }

        try {
            const response = await yt.playlistItems.list({
                key: apiKey,
                part: ['snippet', 'contentDetails'],
                playlistId,
                maxResults: fetchLimit,
                pageToken: channelTokens?.[channel.id],
            });
            return {
                channelId: channel.id,
                items: response.data.items || [],
                nextPageToken: response.data.nextPageToken || undefined,
            };
        } catch (error) {
            console.error(`Error fetching uploads for channel ${channel.id}:`, error);
            return { channelId: channel.id, items: [] as any[], nextPageToken: undefined };
        }
    }));

    const videoIds = rawChannelResults.flatMap(result =>
        result.items.map((item: any) => item.contentDetails?.videoId).filter(Boolean)
    );
    const detailsMap = await getVideoDetails(videoIds, apiKey);

    const channelResults = rawChannelResults.map((result) => {
        const videos: Video[] = result.items
            .map((item: any) => {
                const videoId = item.contentDetails?.videoId;
                const details = detailsMap.get(videoId);
                return {
                    id: videoId || '',
                    title: item.snippet?.title || '',
                    thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
                    channelTitle: item.snippet?.channelTitle || '',
                    publishedAt: item.snippet?.publishedAt || '',
                    channelId: result.channelId,
                    duration: details?.duration,
                    viewCount: details?.viewCount,
                };
            })
            .filter((video: Video) => video.id && !isTooShort(video.duration))
            .slice(0, maxResultsPerChannel);

        return {
            channelId: result.channelId,
            videos,
            nextPageToken: result.nextPageToken,
            hasMore: Boolean(result.nextPageToken),
        };
    });

    const channelVideoLists = channelResults.map((r) => r.videos);
    const maxLen = Math.max(0, ...channelVideoLists.map((list) => list.length));

    const interleavedVideos: Video[] = [];
    for (let i = 0; i < maxLen; i++) {
        const roundVideos: Video[] = [];
        for (const list of channelVideoLists) {
            if (i < list.length) {
                roundVideos.push(list[i]);
            }
        }
        roundVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        interleavedVideos.push(...roundVideos);
    }

    const seenIds = new Set<string>();
    const sortedVideos: Video[] = [];
    for (const v of interleavedVideos) {
        if (!seenIds.has(v.id)) {
            seenIds.add(v.id);
            sortedVideos.push(v);
        }
    }

    const newChannelTokens: Record<string, string | undefined> = {};
    channelResults.forEach((r) => {
        newChannelTokens[r.channelId] = r.nextPageToken;
    });

    const hasMore = channelResults.some((r) => r.hasMore);

    return {
        videos: sortedVideos.slice(0, maxTotalResults),
        channelTokens: newChannelTokens,
        hasMore,
    };
}

export async function getPersonalizedFeedLegacy(channels: Channel[]): Promise<Video[]> {
    const result = await getPersonalizedFeed(channels, 5);
    return result.videos;
}

export async function searchChannels(query: string): Promise<Channel[]> {
    const yt = getYoutubeClient();
    const apiKey = await getApiKey();
    try {
        const response = await yt.search.list({
            key: apiKey,
            part: ['snippet'],
            q: query,
            type: ['channel'],
            maxResults: 5,
        });

        return (response.data.items || []).map((item: any) => ({
            id: item.id?.channelId || '',
            title: item.snippet?.title || '',
            thumbnail: item.snippet?.thumbnails?.medium?.url || '',
        }));
    } catch (error) {
        console.error(`Error searching channels for "${query}":`, error);
        return [];
    }
}

export async function searchCategoryVideos(
    channels: Channel[],
    query: string,
    maxResultsPerChannel = 10
): Promise<{ videos: Video[]; hasMore: boolean }> {
    if (channels.length === 0 || !query.trim()) {
        return { videos: [], hasMore: false };
    }

    const yt = getYoutubeClient();
    const apiKey = await getApiKey();
    try {
        const searchPromises = channels.map(async (ch) => {
            try {
                const response = await yt.search.list({
                    key: apiKey,
                    part: ['snippet'],
                    q: query,
                    channelId: ch.id,
                    type: ['video'],
                    maxResults: maxResultsPerChannel,
                });

                const items = response.data.items || [];
                const videoIds = items.map((item: any) => item.id?.videoId).filter(Boolean);
                return { channelId: ch.id, items, videoIds };
            } catch (err) {
                console.error(`Error searching channel ${ch.id} for "${query}":`, err);
                return { channelId: ch.id, items: [], videoIds: [] };
            }
        });

        const channelResults = await Promise.all(searchPromises);
        const allVideoIds = Array.from(new Set(channelResults.flatMap((r) => r.videoIds)));

        if (allVideoIds.length === 0) {
            return { videos: [], hasMore: false };
        }

        const detailsMap = await getVideoDetails(allVideoIds, apiKey);

        const decodeEntities = (str: string) =>
            str
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');

        const allVideos: Video[] = [];
        for (const res of channelResults) {
            for (const item of res.items) {
                const videoId = item.id?.videoId;
                if (!videoId) continue;
                const details = detailsMap.get(videoId);
                allVideos.push({
                    id: videoId,
                    title: decodeEntities(item.snippet?.title || ''),
                    thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
                    channelTitle: item.snippet?.channelTitle || '',
                    publishedAt: item.snippet?.publishedAt || '',
                    channelId: res.channelId,
                    duration: details?.duration,
                    viewCount: details?.viewCount,
                });
            }
        }

        const seenIds = new Set<string>();
        const filteredVideos: Video[] = [];
        for (const v of allVideos) {
            if (v.id && !seenIds.has(v.id) && !isTooShort(v.duration)) {
                seenIds.add(v.id);
                filteredVideos.push(v);
            }
        }

        filteredVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        return { videos: filteredVideos, hasMore: false };
    } catch (error) {
        console.error(`Error searching category videos for "${query}":`, error);
        return { videos: [], hasMore: false };
    }
}

export function extractYouTubeVideoId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }

    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /(?:music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    try {
        const urlString = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
        const url = new URL(urlString);
        const v = url.searchParams.get('v');
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
            return v;
        }
    } catch {
        // Ignore invalid URL parse errors
    }

    return null;
}

export async function getSingleVideoDetails(videoId: string): Promise<Video | null> {
    const yt = getYoutubeClient();
    const apiKey = await getApiKey();
    try {
        const response = await yt.videos.list({
            key: apiKey,
            part: ['snippet', 'contentDetails', 'statistics'],
            id: [videoId],
        });

        const item = response.data.items?.[0];
        if (!item) return null;

        const snippet = item.snippet;
        const contentDetails = item.contentDetails;
        const statistics = item.statistics;

        return {
            id: item.id || videoId,
            title: snippet?.title || 'Untitled Video',
            thumbnail: snippet?.thumbnails?.maxres?.url || snippet?.thumbnails?.high?.url || snippet?.thumbnails?.medium?.url || snippet?.thumbnails?.default?.url || '',
            channelTitle: snippet?.channelTitle || 'Unknown Channel',
            channelId: snippet?.channelId || '',
            publishedAt: snippet?.publishedAt || new Date().toISOString(),
            duration: contentDetails?.duration || undefined,
            viewCount: statistics?.viewCount || undefined,
        };

    } catch (error) {
        console.error(`Error fetching video details for ${videoId}:`, error);
        return null;
    }
}

export async function searchMusicVideos(
    query: string = 'lofi ambient focus music',
    maxResults = 24
): Promise<Video[]> {
    const yt = getYoutubeClient();
    const apiKey = await getApiKey();
    try {
        const response = await yt.search.list({
            key: apiKey,
            part: ['snippet'],
            q: query,
            type: ['video'],
            videoCategoryId: '10',
            maxResults: maxResults,
        });

        const items = response.data.items || [];
        const videoIds = items.map((item: any) => item.id?.videoId).filter(Boolean);

        if (videoIds.length === 0) {
            return [];
        }

        const detailsMap = await getVideoDetails(videoIds, apiKey);

        const decodeEntities = (str: string) =>
            str
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');

        const mapped: (Video | null)[] = items.map((item: any) => {
            const videoId = item.id?.videoId;
            if (!videoId) return null;
            const details = detailsMap.get(videoId);
            return {
                id: videoId,
                title: decodeEntities(item.snippet?.title || ''),
                thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
                channelTitle: item.snippet?.channelTitle || '',
                publishedAt: item.snippet?.publishedAt || '',
                channelId: item.snippet?.channelId || '',
                duration: details?.duration,
                viewCount: details?.viewCount,
            };
        });

        const videos: Video[] = mapped.filter((v): v is Video => v !== null && Boolean(v.id));

        return videos;
    } catch (error) {
        console.error(`Error searching music videos for "${query}":`, error);
        return [];
    }
}

export async function getRecommendedMusicVideos(
    channels: Channel[] = [],
    musicList: MusicVideo[] = []
): Promise<Video[]> {
    if (musicList && musicList.length > 0) {
        const uniqueArtists: string[] = [];
        const seen = new Set<string>();

        for (const item of musicList) {
            const artist = item.channelTitle?.trim();
            if (artist && !seen.has(artist.toLowerCase())) {
                seen.add(artist.toLowerCase());
                uniqueArtists.push(artist);
            }
            if (uniqueArtists.length >= 3) break;
        }

        if (uniqueArtists.length > 0) {
            const artistPromises = uniqueArtists.map(artist =>
                searchMusicVideos(`${artist} music`, 10)
            );
            const artistResults = await Promise.all(artistPromises);

            const combined: Video[] = [];
            const existingIds = new Set(musicList.map(m => m.id));
            const seenIds = new Set<string>();

            const maxLen = Math.max(0, ...artistResults.map(r => r.length));
            for (let i = 0; i < maxLen; i++) {
                for (const res of artistResults) {
                    if (i < res.length) {
                        const video = res[i];
                        if (!seenIds.has(video.id) && !existingIds.has(video.id)) {
                            seenIds.add(video.id);
                            combined.push(video);
                        }
                    }
                }
            }

            if (combined.length > 0) {
                return combined.slice(0, 24);
            }
        }
    }

    const fallbackQuery = 'korean ost kdrama kpop music';
    return await searchMusicVideos(fallbackQuery, 24);
}

export async function fetchElonMuskVideos(
    filter: 'all' | 'talks' | 'interviews' | 'podcasts' = 'all',
    searchQuery: string = '',
    maxResults = 24,
    minSubscribers = 50000
): Promise<Video[]> {
    const yt = getYoutubeClient();
    const apiKey = await getApiKey();
    try {
        let q = 'Elon Musk';
        if (searchQuery.trim()) {
            q += ` ${searchQuery.trim()}`;
        } else {
            if (filter === 'talks') {
                q += ' talk speech keynote';
            } else if (filter === 'interviews') {
                q += ' interview';
            } else if (filter === 'podcasts') {
                q += ' podcast';
            } else {
                q += ' talk interview podcast';
            }
        }

        const fetchLimit = Math.min(maxResults * 2, 50);

        const response = await yt.search.list({
            key: apiKey,
            part: ['snippet'],
            q: q,
            type: ['video'],
            maxResults: fetchLimit,
            order: 'date',
        });

        const items = response.data.items || [];
        if (items.length === 0) {
            return [];
        }

        const channelIds = items.map((item: any) => item.snippet?.channelId).filter(Boolean);
        const subCountsMap = await getChannelsSubscriberCounts(channelIds, apiKey);

        const filteredItems = items.filter((item: any) => {
            const chId = item.snippet?.channelId;
            if (!chId) return false;
            const subCount = subCountsMap.get(chId) ?? 0;
            return subCount >= minSubscribers;
        });

        const videoIds = filteredItems.map((item: any) => item.id?.videoId).filter(Boolean);

        if (videoIds.length === 0) {
            return [];
        }

        const detailsMap = await getVideoDetails(videoIds, apiKey);

        const decodeEntities = (str: string) =>
            str
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');

        const videos: Video[] = filteredItems
            .map((item: any) => {
                const videoId = item.id?.videoId;
                if (!videoId) return null;
                const details = detailsMap.get(videoId);
                const video: Video = {
                    id: videoId,
                    title: decodeEntities(item.snippet?.title || ''),
                    thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
                    channelTitle: item.snippet?.channelTitle || '',
                    publishedAt: item.snippet?.publishedAt || '',
                    channelId: item.snippet?.channelId || '',
                    duration: details?.duration,
                    viewCount: details?.viewCount,
                };
                return video;
            })
            .filter((v: Video | null): v is Video => v !== null && Boolean(v.id) && !isTooShort(v.duration));

        videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        return videos.slice(0, maxResults);
    } catch (error) {
        console.error(`Error fetching Elon Musk videos (filter: ${filter}):`, error);
        return [];
    }
}
