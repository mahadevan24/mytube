/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from 'googleapis';
import { Video, Channel } from './types';

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

