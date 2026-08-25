"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Video } from '../lib/types';
import VideoCard from './VideoCard';
import Loader from './Loader';

const VideoModal = dynamic(() => import('./VideoModal'), { ssr: false });

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
            setVideos(prev => {
                const existingIds = new Set(prev.map(video => video.id));
                const newVideos = result.videos.filter(video => !existingIds.has(video.id));
                return [...prev, ...newVideos];
            });
            setNextPageToken(result.nextPageToken);
            setHasMore(result.hasMore);
        } catch (err) {
            console.error('Error loading more videos:', err);
            setError('Failed to load more videos. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, nextPageToken, fetchMore]);

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

    const handlePlayVideo = useCallback((videoId: string) => {
        setSelectedVideoId(videoId);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedVideoId(null);
    }, []);

    return (
        <>
            <h2 className="text-xl font-bold tracking-wide text-neutral-900 dark:text-white mb-6">{title}</h2>
            {videos.length === 0 && !isLoading ? (
                <div className="text-center text-neutral-500 mt-20">
                    <p>No videos found matching your criteria.</p>
                    <p>Try refreshing or checking another category.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                        {videos.map((video, index) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onPlay={handlePlayVideo}
                                eagerImage={index < 4}
                            />
                        ))}
                    </div>
                    
                    {/* Intersection Observer target */}
                    {hasMore && (
                        <div ref={observerTarget} className="mt-8 flex min-h-24 justify-center">
                            {isLoading && <Loader compact label="Loading more videos..." />}
                            {error && (
                                <div className="text-neutral-700 dark:text-neutral-300 text-sm">
                                    {error}
                                    <button
                                        onClick={loadMore}
                                        className="ml-2 text-neutral-900 dark:text-white font-semibold underline"
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
