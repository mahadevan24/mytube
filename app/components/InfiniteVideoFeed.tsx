"use client";

import { useState, useEffect } from 'react';
import { Video } from '../lib/types';
import VideoFeed from './VideoFeed';

interface InfiniteVideoFeedProps {
    initialVideos: Video[];
    title: string;
    feedType: 'home' | 'channel' | 'category';
    channelId?: string;
    categoryId?: string;
    initialPageToken?: string;
    initialChannelTokens?: Record<string, string | undefined>;
    searchQuery?: string;
}

export default function InfiniteVideoFeed({
    initialVideos,
    title,
    feedType,
    channelId,
    categoryId,
    initialPageToken,
    initialChannelTokens,
    searchQuery,
}: InfiniteVideoFeedProps) {
    // Track channel tokens for home feed pagination
    const [channelTokens, setChannelTokens] = useState<Record<string, string | undefined>>(
        initialChannelTokens || {}
    );

    // Reset channel tokens when initialChannelTokens changes
    useEffect(() => {
        if (initialChannelTokens) {
            setChannelTokens(initialChannelTokens);
        }
    }, [initialChannelTokens]);

    const fetchMore = async (pageToken?: string) => {
        if (feedType === 'channel' && channelId) {
            const params = new URLSearchParams({
                maxResults: '20',
            });
            if (pageToken) {
                params.set('pageToken', pageToken);
            }

            const response = await fetch(`/api/videos/channel/${channelId}?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch videos');
            }
            return await response.json();
        } else {
            // Home or Category feed
            const params = new URLSearchParams({
                maxResults: '20',
            });

            if (feedType === 'category' && categoryId) {
                params.set('categoryId', categoryId);
            }
            
            // For home/category feed, use current channelTokens or parse from pageToken
            let tokensToUse = channelTokens;
            if (pageToken) {
                // pageToken for home feed is actually the channelTokens JSON
                try {
                    tokensToUse = JSON.parse(pageToken);
                } catch (e) {
                    // Invalid JSON, use current tokens
                    tokensToUse = channelTokens;
                }
            }
            
            if (Object.keys(tokensToUse).length > 0) {
                params.set('channelTokens', JSON.stringify(tokensToUse));
            }

            const response = await fetch(`/api/videos/feed?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch videos');
            }
            const data = await response.json();
            
            // Update channel tokens state
            setChannelTokens(data.channelTokens || {});
            
            // Return nextPageToken as JSON string of channelTokens for home feed
            return {
                videos: data.videos,
                nextPageToken: data.hasMore ? JSON.stringify(data.channelTokens) : undefined,
                hasMore: data.hasMore,
            };
        }
    };

    return (
        <VideoFeed
            initialVideos={initialVideos}
            title={title}
            fetchMore={fetchMore}
            initialPageToken={initialPageToken}
        />
    );
}

