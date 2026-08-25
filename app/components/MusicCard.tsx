'use client';

import { MusicVideo } from '../lib/types';
import Link from 'next/link';
import { Play, Trash2 } from 'lucide-react';

function formatDuration(duration?: string) {
    if (!duration) return null;
    const matches = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!matches) return duration;

    const hours = matches[1] ? matches[1].replace('H', '') : '00';
    const minutes = matches[2] ? matches[2].replace('M', '').padStart(2, '0') : '00';
    const seconds = matches[3] ? matches[3].replace('S', '').padStart(2, '0') : '00';

    if (hours !== '00') {
        return `${hours}:${minutes}:${seconds}`;
    }
    return `${minutes}:${seconds}`;
}

interface MusicCardProps {
    video: MusicVideo;
    onPlay: (videoId: string, loop?: boolean) => void;
    onRemove: (videoId: string) => void;
}

export default function MusicCard({ video, onPlay, onRemove }: MusicCardProps) {
    const handleCardClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onPlay(video.id, true); // Default play on loop for mind-clearing music
    };

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove(video.id);
    };

    return (
        <div className="group flex flex-col gap-3 bg-white dark:bg-neutral-900/60 p-3 rounded-2xl border border-neutral-200/80 dark:border-white/5 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-300 shadow-sm hover:shadow-xl">
            {/* Thumbnail Area */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-950 ring-1 ring-neutral-200 dark:ring-white/5 group-hover:ring-neutral-400 dark:group-hover:ring-neutral-600 transition-all duration-300">
                <button
                    onClick={handleCardClick}
                    className="block w-full h-full text-left relative cursor-pointer group/thumb"
                >
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 group-hover:from-black/80 transition-colors duration-300" />

                    {/* Duration Badge */}
                    {video.duration && (
                        <span className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-neutral-200 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white/10 tracking-wide z-10">
                            {formatDuration(video.duration)}
                        </span>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <div className="w-12 h-12 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-xl scale-90 group-hover/thumb:scale-110 transition-transform duration-300">
                            <Play size={22} className="fill-white dark:fill-neutral-900 ml-0.5" />
                        </div>
                    </div>
                </button>

                {/* Remove Quick Action */}
                <button
                    onClick={handleRemoveClick}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 hover:bg-black dark:hover:bg-white text-neutral-300 hover:text-white dark:hover:text-black opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-md z-30 hover:scale-110"
                    title="Remove from Music List"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Content Details */}
            <div className="flex flex-col gap-1.5 px-1">
                <button
                    onClick={handleCardClick}
                    className="text-neutral-900 dark:text-neutral-100 font-semibold text-sm line-clamp-2 leading-snug hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors text-left"
                >
                    {video.title}
                </button>

                <div className="flex items-center justify-between mt-1">
                    <Link
                        href={`https://youtube.com/channel/${video.channelId}`}
                        target="_blank"
                        className="text-neutral-500 dark:text-neutral-400 text-xs hover:text-neutral-900 dark:hover:text-white transition-colors truncate"
                    >
                        {video.channelTitle}
                    </Link>
                </div>
            </div>
        </div>
    );
}
