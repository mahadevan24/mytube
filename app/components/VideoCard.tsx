import { Video } from '../lib/types';
import Link from 'next/link';
import { Clock } from 'lucide-react';

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
    const handleClick = (e: React.MouseEvent) => {
        if (onPlay) {
            e.preventDefault();
            onPlay(video.id);
        }
    };

    return (
        <div className="group flex flex-col gap-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-900 shadow-sm dark:shadow-lg ring-1 ring-neutral-200 dark:ring-white/5 group-hover:ring-indigo-500/50 dark:group-hover:ring-indigo-500/30 transition-all duration-300">
                <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    onClick={handleClick}
                    className="block w-full h-full cursor-pointer relative"
                    rel="noreferrer"
                >
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                    {/* Play icon overlay on hover could go here, but keeping it clean for now */}

                    {video.duration && (
                        <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white/90 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-white/10 tracking-wide">
                            {formatDuration(video.duration)}
                        </span>
                    )}
                </a>
            </div>
            <div className="flex flex-col gap-1 px-1">
                <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    onClick={handleClick}
                    className="text-neutral-900 dark:text-neutral-200 font-semibold text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-white transition-colors cursor-pointer"
                    rel="noreferrer"
                >
                    {video.title}
                </a>
                <div className="flex items-center justify-between mt-1">
                    <Link href={`https://youtube.com/channel/${video.channelId}`} target="_blank" className="text-neutral-500 dark:text-neutral-400 text-xs hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[60%]">
                        {video.channelTitle}
                    </Link>
                    <div className="text-neutral-500 text-[10px] flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900/50 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-white/5">
                        <Clock size={10} className="text-neutral-600" />
                        {timeAgo(video.publishedAt)}
                    </div>
                </div>
            </div>
        </div>
    );
}
