"use client";

import { useState } from 'react';
import { Video } from '../lib/types';
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';

interface VideoFeedProps {
    videos: Video[];
    title: string;
}

export default function VideoFeed({ videos, title }: VideoFeedProps) {
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

    const handlePlayVideo = (videoId: string) => {
        setSelectedVideoId(videoId);
    };

    const handleCloseModal = () => {
        setSelectedVideoId(null);
    };

    return (
        <>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">{title}</h2>
            {videos.length === 0 ? (
                <div className="text-center text-neutral-500 mt-20">
                    <p>No videos found matching your criteria.</p>
                    <p>Try refreshing or checking another category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                    {videos.map((video) => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            onPlay={handlePlayVideo}
                        />
                    ))}
                </div>
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
