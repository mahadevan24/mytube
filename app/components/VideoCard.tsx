'use client';

import { useState, useEffect } from 'react';
import { Video } from '../lib/types';
import Link from 'next/link';
import { Clock, Bookmark, Check, Loader2, Play, Music } from 'lucide-react';
import { addVideoToWatchlistAction, addVideoToMusicAction } from '../actions';
import { useToast } from './Toast';
import { getWatchProgress, parseIsoDurationToSeconds, formatSecondsToTimestamp, WatchProgress } from '../lib/watchProgress';

function formatDuration(duration?: string) {
    if (!duration) return null;
    // Basic parsing for ISO 8601 duration PT#M#S
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

interface VideoCardProps {
    video: Video;
    onPlay?: (videoId: string) => void;
}

export default function VideoCard({ video, onPlay }: VideoCardProps) {
    const [mounted, setMounted] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavedMusic, setIsSavedMusic] = useState(false);
    const [isSavingMusic, setIsSavingMusic] = useState(false);
    const [progress, setProgress] = useState<WatchProgress | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        setMounted(true);

        const loadProgress = () => {
            const saved = getWatchProgress(video.id);
            setProgress(saved);
        };

        loadProgress();

        const handleProgressUpdate = () => {
            loadProgress();
        };

        window.addEventListener('mytube-watch-progress-updated', handleProgressUpdate);
        return () => {
            window.removeEventListener('mytube-watch-progress-updated', handleProgressUpdate);
        };
    }, [video.id]);

    const handleClick = (e: React.MouseEvent) => {
        if (onPlay) {
            e.preventDefault();
            onPlay(video.id);
        }
    };

    const handleSaveToWatchlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSaved || isSaving) return;

        setIsSaving(true);
        try {
            const res = await addVideoToWatchlistAction(video);
            if (res.success) {
                setIsSaved(true);
                showToast(`Saved "${video.title}" to Watchlist!`, 'success');
            }
        } catch {
            showToast('Failed to save video to Watchlist.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveToMusic = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSavedMusic || isSavingMusic) return;

        setIsSavingMusic(true);
        try {
            const res = await addVideoToMusicAction(video);
            if (res.success) {
                setIsSavedMusic(true);
                showToast(`Saved "${video.title}" to Music List!`, 'success');
            }
        } catch {
            showToast('Failed to save video to Music List.', 'error');
        } finally {
            setIsSavingMusic(false);
        }
    };

    const totalDurationSeconds = video.duration ? parseIsoDurationToSeconds(video.duration) : (progress?.duration || 0);
    const progressPercent = progress && totalDurationSeconds > 0
        ? Math.min(100, Math.max(0, (progress.seconds / totalDurationSeconds) * 100))
        : 0;

    const ytExternalLink = `https://www.youtube.com/watch?v=${video.id}${progress?.seconds ? `&t=${progress.seconds}s` : ''}`;

    return (
        <div className="group flex flex-col gap-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-900 shadow-sm dark:shadow-lg ring-1 ring-neutral-200 dark:ring-white/5 group-hover:ring-neutral-400 dark:group-hover:ring-white/30 transition-all duration-300">
                <a
                    href={ytExternalLink}
                    target="_blank"
                    onClick={handleClick}
                    className="block w-full h-full cursor-pointer relative"
                    rel="noreferrer"
                >
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                    {/* Resume Timestamp Badge */}
                    {mounted && progress && progress.seconds > 0 && (
                        <span className="absolute bottom-2 left-2 bg-black/85 backdrop-blur-md text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white/30 flex items-center gap-1 z-10">
                            <Play size={10} className="fill-white" />
                            Resume {formatSecondsToTimestamp(progress.seconds)}
                        </span>
                    )}

                    {video.duration && (
                        <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white/10 tracking-wide z-10">
                            {formatDuration(video.duration)}
                        </span>
                    )}

                    {/* Watch progress bar at bottom of thumbnail */}
                    {mounted && progress && progress.seconds > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800/80 z-20 overflow-hidden">
                            <div
                                className="h-full bg-neutral-900 dark:bg-white transition-all duration-300"
                                style={{ width: `${progressPercent > 0 ? progressPercent : 100}%` }}
                            />
                        </div>
                    )}
                </a>

                {/* Save Quick Action Buttons */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                    <button
                        onClick={handleSaveToMusic}
                        disabled={isSavingMusic}
                        className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 shadow-md ${isSavedMusic ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 opacity-100' : 'bg-black/60 hover:bg-neutral-800 text-white opacity-0 group-hover:opacity-100 hover:scale-110'}`}
                        title={isSavedMusic ? 'Saved to Music List' : 'Save to Music List'}
                    >
                        {isSavingMusic ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : isSavedMusic ? (
                            <Check size={14} />
                        ) : (
                            <Music size={14} />
                        )}
                    </button>

                    <button
                        onClick={handleSaveToWatchlist}
                        disabled={isSaving}
                        className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 shadow-md ${isSaved ? 'bg-black dark:bg-white text-white dark:text-black opacity-100' : 'bg-black/60 hover:bg-neutral-800 text-white opacity-0 group-hover:opacity-100 hover:scale-110'}`}
                        title={isSaved ? 'Saved to Watchlist' : 'Save to Watchlist'}
                    >
                        {isSaving ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : isSaved ? (
                            <Check size={14} />
                        ) : (
                            <Bookmark size={14} />
                        )}
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-1 px-1">
                <a
                    href={ytExternalLink}
                    target="_blank"
                    onClick={handleClick}
                    className="text-neutral-900 dark:text-neutral-200 font-semibold text-sm line-clamp-2 leading-snug group-hover:text-black dark:group-hover:text-white transition-colors cursor-pointer"
                    rel="noreferrer"
                >
                    {video.title}
                </a>
                <div className="flex items-center justify-between mt-1">
                    <Link href={`https://youtube.com/channel/${video.channelId}`} target="_blank" className="text-neutral-500 dark:text-neutral-400 text-xs hover:text-black dark:hover:text-white transition-colors truncate max-w-[60%]">
                        {video.channelTitle}
                    </Link>
                    <div className="text-neutral-500 text-[10px] flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900/50 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-white/5">
                        {mounted && (
                            <>
                                <Clock size={10} className="text-neutral-600" />
                                {timeAgo(video.publishedAt)}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
