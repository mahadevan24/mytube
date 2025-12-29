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


// Fetch videos from a channel's uploads playlist
// UPDATED: Fetches more items (20) and filters out Shorts (duration <= 60s)
export async function getChannelVideos(channelId: string, maxResults = 10): Promise<Video[]> {
    const yt = getYoutubeClient();
    const uploadsPlaylistId = await getUploadsPlaylistId(channelId);

    if (!uploadsPlaylistId) return [];

    try {
        // Fetch more items than requested to account for filtering
        const fetchLimit = Math.max(maxResults * 4, 20);

        const response = await yt.playlistItems.list({
            key: process.env.YOUTUBE_API_KEY,
            part: ['snippet', 'contentDetails'],
            playlistId: uploadsPlaylistId,
            maxResults: fetchLimit,
        });

        const items = response.data.items || [];
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

        return videos.slice(0, maxResults);
    } catch (error) {
        console.error(`Error fetching uploads for channel ${channelId}:`, error);
        return [];
    }
}

export async function getPersonalizedFeed(channels: Channel[]): Promise<Video[]> {
    // Increase channel fetch to ensures we have candidates after filtering
    const channelPromises = channels.map((c) => getChannelVideos(c.id, 5));

    const channelResults = await Promise.all(channelPromises);

    const allVideos = channelResults.flat();

    // Remove duplicates (by video ID)
    const uniqueVideos = Array.from(new Map(allVideos.map((v) => [v.id, v])).values());

    // Sort by publishedAt descending (newest first)
    return uniqueVideos.sort((a, b) => {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
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
