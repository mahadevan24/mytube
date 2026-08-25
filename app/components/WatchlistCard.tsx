'use client';

import { useState } from 'react';
import { WatchlistVideo, WatchlistStatus } from '../lib/types';
import { Play, Trash2, CheckCircle2, Bookmark, Eye, ExternalLink, Calendar } from 'lucide-react';

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

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";

    return Math.floor(seconds) + "s ago";
}

interface WatchlistCardProps {
    video: WatchlistVideo;
    onPlay: (videoId: string) => void;
    onRemove: (videoId: string) => void;
    onStatusChange: (videoId: string, status: WatchlistStatus) => void;
}

export default function WatchlistCard({ video, onPlay, onRemove, onStatusChange }: WatchlistCardProps) {
    const [isRemoving, setIsRemoving] = useState(false);

    const handlePlayClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onPlay(video.id);
    };

    const handleRemove = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRemoving(true);
        try {
            await onRemove(video.id);
        } catch {
            setIsRemoving(false);
        }
    };

    const statusBadgeColors = {
        unwatched: 'bg-black/80 dark:bg-white/80 text-white dark:text-black border-white/20',
        watching: 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black border-white/20',
        completed: 'bg-neutral-200/80 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-white/10',
    };

    const statusIcons = {
        unwatched: <Bookmark size={12} />,
        watching: <Eye size={12} />,
        completed: <CheckCircle2 size={12} />,
    };

    const statusLabels = {
        unwatched: 'Saved to Watch',
        watching: 'Watching',
        completed: 'Completed',
    };

    return (
        <div
            className={`group relative bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-neutral-400 dark:hover:border-neutral-600 ${isRemoving ? 'opacity-40 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}
            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 360px' }}
        >
            <div className="space-y-3">
                {/* Thumbnail Container */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-950 ring-1 ring-black/5 dark:ring-white/5">
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Play Overlay */}
                    <button
                        onClick={handlePlayClick}
                        className="absolute inset-0 bg-black/30 group-hover:bg-black/40 flex items-center justify-center transition-colors group"
                        title="Play Video"
                    >
                        <div className="w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Play size={20} className="fill-white dark:fill-black ml-0.5" />
                        </div>
                    </button>

                    {/* Duration Badge */}
                    {video.duration && (
                        <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow border border-white/10 tracking-wide">
                            {formatDuration(video.duration)}
                        </span>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md border flex items-center gap-1.5 shadow-sm ${statusBadgeColors[video.status || 'unwatched']}`}>
                            {statusIcons[video.status || 'unwatched']}
                            {statusLabels[video.status || 'unwatched']}
                        </span>
                    </div>

                    {/* Remove Button */}
                    <button
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black dark:hover:bg-white text-neutral-300 hover:text-white dark:hover:text-black rounded-full transition-all duration-200 backdrop-blur-md shadow-md hover:scale-110"
                        title="Remove from Watchlist"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Video Info */}
                <div className="space-y-1 px-1">
                    <button
                        onClick={handlePlayClick}
                        className="text-left font-semibold text-sm text-neutral-900 dark:text-white line-clamp-2 leading-snug hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    >
                        {video.title}
                    </button>

                    <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                        <span className="truncate max-w-[65%] font-medium text-neutral-700 dark:text-neutral-300">
                            {video.channelTitle}
                        </span>
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1" suppressHydrationWarning>
                            <Calendar size={10} />
                            {timeAgo(video.addedAt || video.publishedAt)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-white/5 flex items-center justify-between gap-2">
                {/* Status Switcher */}
                <div className="flex items-center gap-1 bg-neutral-200/60 dark:bg-neutral-800/60 p-0.5 rounded-lg border border-neutral-300/40 dark:border-white/5 text-[11px]">
                    <button
                        onClick={() => onStatusChange(video.id, 'unwatched')}
                        className={`px-2 py-1 rounded-md font-medium transition-all ${video.status === 'unwatched' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm font-semibold' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
                        title="Mark as Unwatched"
                    >
                        Saved
                    </button>
                    <button
                        onClick={() => onStatusChange(video.id, 'watching')}
                        className={`px-2 py-1 rounded-md font-medium transition-all ${video.status === 'watching' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm font-semibold' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
                        title="Mark as Watching"
                    >
                        Watching
                    </button>
                    <button
                        onClick={() => onStatusChange(video.id, 'completed')}
                        className={`px-2 py-1 rounded-md font-medium transition-all ${video.status === 'completed' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm font-semibold' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
                        title="Mark as Completed"
                    >
                        Done
                    </button>
                </div>

                {/* External Link */}
                <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 rounded-lg transition-colors"
                    title="Open in YouTube"
                >
                    <ExternalLink size={14} />
                </a>
            </div>
        </div>
    );
}
