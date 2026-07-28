/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from 'googleapis';
import { Video, Channel, MusicVideo } from './types';

const youtube = google.youtube('v3');

// Initialize with API Key from environment variables
const getYoutubeClient = () => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.error('YOUTUBE_API_KEY is missing');
        // In a real app, you might want to throw an error or handle this more gracefully
        // depending on where this is called.
    }
    return youtube;
};

// Helper: Get Uploads Playlist ID for a Channel
async function getUploadsPlaylistId(channelId: string): Promise<string | null> {
    const yt = getYoutubeClient();
    try {
        const response = await yt.channels.list({
            key: process.env.YOUTUBE_API_KEY,
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

// Fetch video details (duration) for a list of video IDs
async function getVideoDetails(videoIds: string[]): Promise<Map<string, { duration: string; viewCount?: string }>> {
    if (videoIds.length === 0) return new Map();
    const yt = getYoutubeClient();
    try {
        const response = await yt.videos.list({
            key: process.env.YOUTUBE_API_KEY,
            part: ['contentDetails', 'statistics'],
            id: videoIds,
        });

        const detailsMap = new Map();
        (response.data.items || []).forEach((item: any) => {
            if (item.id) {
                detailsMap.set(item.id, {
                    duration: item.contentDetails?.duration,
                    viewCount: item.statistics?.viewCount,
                });
            }
        });
        return detailsMap;
    } catch (error) {
        console.error('Error fetching video details:', error);
        return new Map();
    }
}

// Helper to check if duration is too short (< 5 mins)
function isTooShort(durationIso?: string): boolean {
    if (!durationIso) return false; // Assume long form if unknown
    const matches = durationIso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!matches) return false;

    const hours = parseInt(matches[1]?.replace('H', '') || '0', 10);
    const minutes = parseInt(matches[2]?.replace('M', '') || '0', 10);
    const seconds = parseInt(matches[3]?.replace('S', '') || '0', 10);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds < 300; // Filter out videos shorter than 5 minutes
}


// Fetch videos from a channel's uploads playlist with pagination support
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
    const uploadsPlaylistId = await getUploadsPlaylistId(channelId);

    if (!uploadsPlaylistId) {
        return { videos: [], hasMore: false };
    }

    try {
        // Fetch more items than requested to account for filtering
        const fetchLimit = Math.max(maxResults * 4, 50);

        const response = await yt.playlistItems.list({
            key: process.env.YOUTUBE_API_KEY,
            part: ['snippet', 'contentDetails'],
            playlistId: uploadsPlaylistId,
            maxResults: fetchLimit,
            pageToken: pageToken,
        });

        const items = response.data.items || [];
        const nextPageToken = response.data.nextPageToken;
        const videoIds = items.map((item: any) => item.contentDetails?.videoId).filter(Boolean);

        // Fetch details (duration)
        const detailsMap = await getVideoDetails(videoIds);

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
            // Filter out empty IDs and short videos (< 5m)
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

// Legacy function for backward compatibility
export async function getChannelVideosLegacy(channelId: string, maxResults = 10): Promise<Video[]> {
    const result = await getChannelVideos(channelId, maxResults);
    return result.videos;
}

export interface PersonalizedFeedResponse {
    videos: Video[];
    channelTokens: Record<string, string | undefined>; // channelId -> nextPageToken
    hasMore: boolean;
}

export async function getPersonalizedFeed(
    channels: Channel[],
    maxResultsPerChannel = 10,
    channelTokens?: Record<string, string | undefined>
): Promise<PersonalizedFeedResponse> {
    if (channels.length === 0) {
        return { videos: [], channelTokens: {}, hasMore: false };
    }

    // Fetch videos from each channel with pagination
    const channelPromises = channels.map(async (c) => {
        const pageToken = channelTokens?.[c.id];
        const result = await getChannelVideos(c.id, maxResultsPerChannel, pageToken);
        return {
            channelId: c.id,
            videos: result.videos,
            nextPageToken: result.nextPageToken,
            hasMore: result.hasMore,
        };
    });

    const channelResults = await Promise.all(channelPromises);

    // Interleave videos round-by-round across channels:
    // Round 0: 1st (latest) video from each channel, sorted among themselves by publishedAt desc
    // Round 1: 2nd latest video from each channel, sorted among themselves by publishedAt desc
    // etc.
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
        // Sort videos within this round by publishedAt descending (newest first)
        roundVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        interleavedVideos.push(...roundVideos);
    }

    // Remove duplicates (by video ID), preserving round-robin order
    const seenIds = new Set<string>();
    const sortedVideos: Video[] = [];
    for (const v of interleavedVideos) {
        if (!seenIds.has(v.id)) {
            seenIds.add(v.id);
            sortedVideos.push(v);
        }
    }

    // Build channel tokens map
    const newChannelTokens: Record<string, string | undefined> = {};
    channelResults.forEach((r) => {
        newChannelTokens[r.channelId] = r.nextPageToken;
    });

    const hasMore = channelResults.some((r) => r.hasMore);

    return {
        videos: sortedVideos,
        channelTokens: newChannelTokens,
        hasMore,
    };
}

// Legacy function for backward compatibility
export async function getPersonalizedFeedLegacy(channels: Channel[]): Promise<Video[]> {
    const result = await getPersonalizedFeed(channels, 5);
    return result.videos;
}

// Helper to search channels (for adding interests)
export async function searchChannels(query: string): Promise<Channel[]> {
    const yt = getYoutubeClient();
    try {
        const response = await yt.search.list({
            key: process.env.YOUTUBE_API_KEY,
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

// Search videos belonging specifically to a set of channels matching a query
export async function searchCategoryVideos(
    channels: Channel[],
    query: string,
    maxResultsPerChannel = 10
): Promise<{ videos: Video[]; hasMore: boolean }> {
    if (channels.length === 0 || !query.trim()) {
        return { videos: [], hasMore: false };
    }

    const yt = getYoutubeClient();
    try {
        const searchPromises = channels.map(async (ch) => {
            try {
                const response = await yt.search.list({
                    key: process.env.YOUTUBE_API_KEY,
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

        const detailsMap = await getVideoDetails(allVideoIds);

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

        // Filter short videos < 5m and remove duplicates
        const seenIds = new Set<string>();
        const filteredVideos: Video[] = [];
        for (const v of allVideos) {
            if (v.id && !seenIds.has(v.id) && !isTooShort(v.duration)) {
                seenIds.add(v.id);
                filteredVideos.push(v);
            }
        }

        // Sort by publishedAt desc
        filteredVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        return { videos: filteredVideos, hasMore: false };
    } catch (error) {
        console.error(`Error searching category videos for "${query}":`, error);
        return { videos: [], hasMore: false };
    }
}


// Extract 11-character YouTube video ID from various URL patterns or direct ID input
export function extractYouTubeVideoId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();

    // 1. Direct ID check (11 characters like dQw4w9WgXcQ)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }

    // 2. Standard URL regex patterns
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

    // 3. Fallback: URL search parameter 'v' extraction
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

// Fetch single video details by video ID using YouTube Data API
export async function getSingleVideoDetails(videoId: string): Promise<Video | null> {
    const yt = getYoutubeClient();
    try {
        const response = await yt.videos.list({
            key: process.env.YOUTUBE_API_KEY,
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

// Search YouTube specifically for music videos (videoCategoryId = 10)
export async function searchMusicVideos(
    query: string = 'lofi ambient focus music',
    maxResults = 24
): Promise<Video[]> {
    const yt = getYoutubeClient();
    try {
        const response = await yt.search.list({
            key: process.env.YOUTUBE_API_KEY,
            part: ['snippet'],
            q: query,
            type: ['video'],
            videoCategoryId: '10', // Category 10 = Music
            maxResults: maxResults,
        });

        const items = response.data.items || [];
        const videoIds = items.map((item: any) => item.id?.videoId).filter(Boolean);

        if (videoIds.length === 0) {
            return [];
        }

        const detailsMap = await getVideoDetails(videoIds);

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

// Generate music recommendations based on user's saved musicList first, then fallback to Korean/KDrama/K-pop music
export async function getRecommendedMusicVideos(
    channels: Channel[] = [],
    musicList: MusicVideo[] = []
): Promise<Video[]> {
    // 1. Check saved musicList for artist/channel names first
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
            // Query artists individually to get focused recommendations
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

    // 2. Fallback to Korean, K-drama, K-pop music
    const fallbackQuery = 'korean ost kdrama kpop music';
    return await searchMusicVideos(fallbackQuery, 24);
}

// Search YouTube specifically for Elon Musk videos (talks, interviews, podcasts)
export async function fetchElonMuskVideos(
    filter: 'all' | 'talks' | 'interviews' | 'podcasts' = 'all',
    searchQuery: string = '',
    maxResults = 24
): Promise<Video[]> {
    const yt = getYoutubeClient();
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

        const response = await yt.search.list({
            key: process.env.YOUTUBE_API_KEY,
            part: ['snippet'],
            q: q,
            type: ['video'],
            maxResults: maxResults,
            order: 'date',
        });

        const items = response.data.items || [];
        const videoIds = items.map((item: any) => item.id?.videoId).filter(Boolean);

        if (videoIds.length === 0) {
            return [];
        }

        const detailsMap = await getVideoDetails(videoIds);

        const decodeEntities = (str: string) =>
            str
                .replace(/&amp;/g, '&')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');

        const videos: Video[] = items
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

        return videos;
    } catch (error) {
        console.error(`Error fetching Elon Musk videos (filter: ${filter}):`, error);
        return [];
    }
}



