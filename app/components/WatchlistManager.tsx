'use client';

import { useState, useTransition } from 'react';
import { WatchlistVideo, WatchlistStatus } from '../lib/types';
import WatchlistCard from './WatchlistCard';
import VideoModal from './VideoModal';
import {
    addWatchlistVideoByUrlAction,
    removeWatchlistVideoAction,
    updateWatchlistStatusAction
} from '../actions';
import {
    Bookmark,
    Plus,
    Link2,
    Loader2,
    Search,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    Eye,
    Sparkles,
    Check
} from 'lucide-react';
import { useToast } from './Toast';

interface WatchlistManagerProps {
    initialWatchlist: WatchlistVideo[];
}

export default function WatchlistManager({ initialWatchlist }: WatchlistManagerProps) {
    const [watchlist, setWatchlist] = useState<WatchlistVideo[]>(initialWatchlist);
    const [inputUrl, setInputUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | WatchlistStatus>('watching');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputUrl.trim()) return;

        setIsLoading(true);
        try {
            const res = await addWatchlistVideoByUrlAction(inputUrl.trim());
            if (res.error) {
                showToast(res.error, 'error');
            } else if (res.video) {
                showToast(`Saved "${res.video.title}" to Watchlist!`, 'success');
                setInputUrl('');
                // Optimistically prepend to list if not already there
                setWatchlist(prev => {
                    const filtered = prev.filter(v => v.id !== res.video!.id);
                    return [res.video!, ...filtered];
                });
            }
        } catch (err) {
            console.error('Failed to add video:', err);
            showToast('An unexpected error occurred while adding the video.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveVideo = async (videoId: string) => {
        // Optimistic UI update
        const removedItem = watchlist.find(v => v.id === videoId);
        setWatchlist(prev => prev.filter(v => v.id !== videoId));

        startTransition(async () => {
            const res = await removeWatchlistVideoAction(videoId);
            if (res.error) {
                showToast('Failed to remove video from Watchlist', 'error');
                // Revert if error
                if (removedItem) {
                    setWatchlist(prev => [removedItem, ...prev]);
                }
            } else {
                showToast('Removed video from Watchlist', 'info');
            }
        });
    };


    const handleStatusChange = async (videoId: string, newStatus: WatchlistStatus) => {
        // Optimistic update
        setWatchlist(prev =>
            prev.map(v => (v.id === videoId ? { ...v, status: newStatus } : v))
        );

        startTransition(async () => {
            await updateWatchlistStatusAction(videoId, newStatus);
        });
    };

    // Filter and Sort Logic
    const filteredWatchlist = watchlist.filter(video => {
        const matchesStatus = filterStatus === 'all' || video.status === filterStatus;
        const matchesSearch =
            video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.channelTitle.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const sortedWatchlist = [...filteredWatchlist].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.addedAt || b.publishedAt).getTime() - new Date(a.addedAt || a.publishedAt).getTime();
        } else if (sortBy === 'oldest') {
            return new Date(a.addedAt || a.publishedAt).getTime() - new Date(b.addedAt || b.publishedAt).getTime();
        } else {
            return a.title.localeCompare(b.title);
        }
    });

    const counts = {
        all: watchlist.length,
        unwatched: watchlist.filter(v => v.status === 'unwatched').length,
        watching: watchlist.filter(v => v.status === 'watching').length,
        completed: watchlist.filter(v => v.status === 'completed').length,
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Top Bar: Title, Counters & Quick Add Input */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/10 pb-4">


                {/* Inline Compact Add Video Form */}
                <form onSubmit={handleAddVideo} className="flex items-center gap-2 w-full md:w-auto md:max-w-md">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                            <Link2 size={15} />
                        </div>
                        <input
                            type="text"
                            value={inputUrl}
                            onChange={e => setInputUrl(e.target.value)}
                            placeholder="Paste YouTube Video Link or ID..."
                            className="w-full pl-9 pr-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs transition-all"
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !inputUrl.trim()}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Fetching...</span>
                            </>
                        ) : (
                            <>
                                <Plus size={14} />
                                <span>Add Video</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Toolbar: Filter Tabs & Search / Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-2">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${filterStatus === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
                    >
                        All ({counts.all})
                    </button>
                    <button
                        onClick={() => setFilterStatus('unwatched')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${filterStatus === 'unwatched' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
                    >
                        <Bookmark size={13} />
                        Saved ({counts.unwatched})
                    </button>

                    <button
                        onClick={() => setFilterStatus('watching')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${filterStatus === 'watching' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
                    >
                        <Eye size={13} />
                        Watching ({counts.watching})
                    </button>
                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${filterStatus === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}
                    >
                        <CheckCircle2 size={13} />
                        Completed ({counts.completed})
                    </button>
                </div>

                {/* Search & Sort */}
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1 sm:w-48">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Filter Watchlist..."
                            className="w-full pl-8 pr-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="appearance-none pl-8 pr-6 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="title">By Title</option>
                        </select>
                        <ArrowUpDown size={12} className="absolute left-2.5 top-2.5 text-neutral-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Watchlist Grid or Empty States */}
            {sortedWatchlist.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedWatchlist.map(video => (
                        <WatchlistCard
                            key={video.id}
                            video={video}
                            onPlay={id => setActiveVideoId(id)}
                            onRemove={handleRemoveVideo}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-neutral-50 dark:bg-neutral-900/40 border border-dashed border-neutral-300 dark:border-white/10 rounded-2xl text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                        <Bookmark size={32} />
                    </div>
                    <div className="max-w-md space-y-1">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            {searchQuery || filterStatus !== 'all' ? 'No matching videos found' : 'Your Watchlist is empty'}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {searchQuery || filterStatus !== 'all'
                                ? 'Try adjusting your filter status or search term.'
                                : 'Paste a YouTube video link above or click the save icon on any video from your feed to add it here!'}
                        </p>
                    </div>
                </div>
            )}

            {/* Embedded Video Player Modal */}
            {activeVideoId && (
                <VideoModal videoId={activeVideoId} onClose={() => setActiveVideoId(null)} />
            )}
        </div>
    );
}
