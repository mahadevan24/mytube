'use client';

import { useState, useTransition } from 'react';
import { MusicVideo } from '../lib/types';
import MusicCard from './MusicCard';
import VideoModal from './VideoModal';
import {
    addMusicVideoByUrlAction,
    removeMusicVideoAction
} from '../actions';
import {
    Music,
    Plus,
    Link2,
    Loader2,
    Search,
    ArrowUpDown,
    Radio,
    Play,
    Sparkles,
    Disc
} from 'lucide-react';
import { useToast } from './Toast';

interface MusicManagerProps {
    initialMusicList: MusicVideo[];
}

export default function MusicManager({ initialMusicList }: MusicManagerProps) {
    const [musicList, setMusicList] = useState<MusicVideo[]>(initialMusicList);
    const [inputUrl, setInputUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [isLoopMode, setIsLoopMode] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();

    const handleAddVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputUrl.trim()) return;

        setIsLoading(true);
        try {
            const res = await addMusicVideoByUrlAction(inputUrl.trim());
            if (res.error) {
                showToast(res.error, 'error');
            } else if (res.video) {
                showToast(`Added "${res.video.title}" to Music List!`, 'success');
                setInputUrl('');
                setMusicList(prev => {
                    const filtered = prev.filter(v => v.id !== res.video!.id);
                    return [res.video!, ...filtered];
                });
            }
        } catch (err) {
            console.error('Failed to add music video:', err);
            showToast('An unexpected error occurred while adding the music video.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveVideo = async (videoId: string) => {
        const removedItem = musicList.find(v => v.id === videoId);
        setMusicList(prev => prev.filter(v => v.id !== videoId));

        startTransition(async () => {
            const res = await removeMusicVideoAction(videoId);
            if (res.error) {
                showToast('Failed to remove video from Music List', 'error');
                if (removedItem) {
                    setMusicList(prev => [removedItem, ...prev]);
                }
            } else {
                showToast('Removed video from Music List', 'info');
            }
        });
    };

    const handlePlayVideo = (videoId: string, loop: boolean = true) => {
        setIsLoopMode(loop);
        setActiveVideoId(videoId);
    };

    const handlePlayRandom = () => {
        if (musicList.length === 0) return;
        const randomIndex = Math.floor(Math.random() * musicList.length);
        handlePlayVideo(musicList[randomIndex].id, true);
    };

    // Filter and Sort Logic
    const filteredMusicList = musicList.filter(video => {
        return (
            video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const sortedMusicList = [...filteredMusicList].sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.addedAt || b.publishedAt).getTime() - new Date(a.addedAt || a.publishedAt).getTime();
        } else if (sortBy === 'oldest') {
            return new Date(a.addedAt || a.publishedAt).getTime() - new Date(b.addedAt || b.publishedAt).getTime();
        } else {
            return a.title.localeCompare(b.title);
        }
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Title & Description */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-white/10 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl ring-1 ring-purple-500/30">
                            <Radio size={26} className="animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                                Mind Clear Music
                                <Sparkles size={18} className="text-purple-400" />
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Save ambient, lofi, or chill music videos to play on repeat whenever you need to focus or clear your mind.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Counter & Quick Play Controls */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-semibold text-purple-600 dark:text-purple-300">
                        {musicList.length} Tracks
                    </span>
                    {musicList.length > 0 && (
                        <button
                            onClick={handlePlayRandom}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md hover:shadow-purple-500/25 transition-all hover:scale-105"
                        >
                            <Play size={13} className="fill-white" />
                            <span>Random Mind Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Add Music Form */}
            <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-purple-900/10 border border-purple-500/20 dark:border-purple-500/30 rounded-2xl p-4 md:p-6 shadow-sm">
                <form onSubmit={handleAddVideo} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                            <Link2 size={18} />
                        </div>
                        <input
                            type="text"
                            value={inputUrl}
                            onChange={e => setInputUrl(e.target.value)}
                            placeholder="Paste YouTube Music Video Link or ID..."
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm shadow-sm transition-all"
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !inputUrl.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-purple-500/25 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Fetching Track...</span>
                            </>
                        ) : (
                            <>
                                <Plus size={18} />
                                <span>Add Track</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Toolbar: Search & Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Disc size={14} className="text-purple-500" />
                    <span>{sortedMusicList.length} music video{sortedMusicList.length === 1 ? '' : 's'}</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-56">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search music list..."
                            className="w-full pl-8 pr-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="appearance-none pl-8 pr-6 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="title">By Title</option>
                        </select>
                        <ArrowUpDown size={12} className="absolute left-2.5 top-2.5 text-neutral-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Music Grid */}
            {sortedMusicList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedMusicList.map(video => (
                        <MusicCard
                            key={video.id}
                            video={video}
                            onPlay={handlePlayVideo}
                            onRemove={handleRemoveVideo}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-neutral-50 dark:bg-neutral-900/40 border border-dashed border-neutral-300 dark:border-white/10 rounded-2xl text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Music size={32} />
                    </div>
                    <div className="max-w-md space-y-1">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            {searchQuery ? 'No matching music videos found' : 'Your Music List is empty'}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {searchQuery
                                ? 'Try adjusting your search query.'
                                : 'Paste a YouTube music video link above or click the music icon on any video in your feed to save it here!'}
                        </p>
                    </div>
                </div>
            )}

            {/* Embedded Video Player Modal */}
            {activeVideoId && (
                <VideoModal
                    videoId={activeVideoId}
                    loop={isLoopMode}
                    onClose={() => setActiveVideoId(null)}
                />
            )}
        </div>
    );
}
