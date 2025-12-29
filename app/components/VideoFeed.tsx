"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Video } from '../lib/types';
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import Loader from './Loader';

interface VideoFeedProps {
    initialVideos: Video[];
    title: string;
    fetchMore: (pageToken?: string) => Promise<{
        videos: Video[];
        nextPageToken?: string;
        hasMore: boolean;
    }>;
    initialPageToken?: string;
}

export default function VideoFeed({ initialVideos, title, fetchMore, initialPageToken }: VideoFeedProps) {
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [videos, setVideos] = useState<Video[]>(initialVideos);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(!!initialPageToken);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(initialPageToken);
    const [error, setError] = useState<string | null>(null);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Reset videos when initialVideos change (e.g., when switching channels)
    useEffect(() => {
        setVideos(initialVideos);
        setNextPageToken(initialPageToken);
        setHasMore(!!initialPageToken);
        setError(null);
    }, [initialVideos, initialPageToken]);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore || !nextPageToken) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await fetchMore(nextPageToken);
            
            // Remove duplicates by video ID
            const existingIds = new Set(videos.map(v => v.id));
            const newVideos = result.videos.filter(v => !existingIds.has(v.id));
            
            // Sort all videos by publishedAt descending (newest first)
            const allVideos = [...videos, ...newVideos].sort((a, b) => {
                return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
            });

            setVideos(allVideos);
            setNextPageToken(result.nextPageToken);
            setHasMore(result.hasMore);
        } catch (err) {
            console.error('Error loading more videos:', err);
            setError('Failed to load more videos. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, nextPageToken, videos, fetchMore]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, isLoading, loadMore]);

    const handlePlayVideo = (videoId: string) => {
        setSelectedVideoId(videoId);
    };

    const handleCloseModal = () => {
        setSelectedVideoId(null);
    };

    return (
        <>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">{title}</h2>
            {videos.length === 0 && !isLoading ? (
                <div className="text-center text-neutral-500 mt-20">
                    <p>No videos found matching your criteria.</p>
                    <p>Try refreshing or checking another category.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                        {videos.map((video) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onPlay={handlePlayVideo}
                            />
                        ))}
                    </div>
                    
                    {/* Intersection Observer target */}
                    {hasMore && (
                        <div ref={observerTarget} className="mt-8 flex justify-center">
                            {isLoading && <Loader />}
                            {error && (
                                <div className="text-red-500 text-sm">
                                    {error}
                                    <button
                                        onClick={loadMore}
                                        className="ml-2 text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {selectedVideoId && (
                <VideoModal
                    videoId={selectedVideoId}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
}
