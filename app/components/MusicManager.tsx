'use client';

import { useState, useEffect, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { MusicVideo, Video } from '../lib/types';
import MusicCard from './MusicCard';
import VideoCard from './VideoCard';
import {
    addMusicVideoByUrlAction,
    removeMusicVideoAction,
    getMusicRecommendationsAction,
    getMusicListAction
} from '../actions';
import {
    Music,
    Plus,
    Link2,
    Loader2,
    Search,
    ArrowUpDown,
    Play,
    Sparkles,
    Disc,
    Compass,
    ListMusic
} from 'lucide-react';
import { useToast } from './Toast';

const VideoModal = dynamic(() => import('./VideoModal'), { ssr: false });

interface MusicManagerProps {
    initialMusicList: MusicVideo[];
}

const GENRE_PRESETS = [
    { label: '✨ For You', query: '' },
    { label: '🇰🇷 K-Pop & KDrama', query: 'korean ost kdrama kpop music' },
    { label: '🎧 Lofi & Ambient', query: 'lofi ambient music' },
    { label: '☕ Chill Beats', query: 'chill beats study music' },
    { label: '🎹 Instrumental & Focus', query: 'instrumental focus music' },
    { label: '🎸 Acoustic & Piano', query: 'relaxing acoustic piano music' },
    { label: '🌌 Synthwave', query: 'synthwave chillwave music' },
];

export default function MusicManager({ initialMusicList }: MusicManagerProps) {
    const [activeTab, setActiveTab] = useState<'my-list' | 'discover'>('my-list');
    const [musicList, setMusicList] = useState<MusicVideo[]>(initialMusicList);
    const [inputUrl, setInputUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [isLoopMode, setIsLoopMode] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
    const [isPending, startTransition] = useTransition();
    const { showToast } = useToast();

    // Discover Tab State
    const [recommendations, setRecommendations] = useState<Video[]>([]);
    const [isFetchingRecs, setIsFetchingRecs] = useState(false);
    const [activePreset, setActivePreset] = useState<string>('');
    const [discoverQuery, setDiscoverQuery] = useState('');

    // Fetch music recommendations
    const fetchRecommendations = async (queryToSearch: string) => {
        setIsFetchingRecs(true);
        try {
            const recs = await getMusicRecommendationsAction(queryToSearch);
            setRecommendations(recs);
        } catch (err) {
            console.error('Failed to fetch recommendations:', err);
            showToast('Failed to load music recommendations', 'error');
        } finally {
            setIsFetchingRecs(false);
        }
    };

    // Load recommendations on first tab switch
    useEffect(() => {
        if (activeTab === 'discover' && recommendations.length === 0 && !isFetchingRecs) {
            fetchRecommendations(activePreset);
        }
    }, [activeTab]);

    // Handle tab change & sync music list
    const handleTabChange = async (tab: 'my-list' | 'discover') => {
        setActiveTab(tab);
        if (tab === 'my-list') {
            // Refresh saved music list from server to ensure any newly added videos from Discover are present
            try {
                const freshList = await getMusicListAction();
                if (freshList) setMusicList(freshList);
            } catch (err) {
                console.error('Error refreshing music list:', err);
            }
        }
    };

    const handlePresetClick = (presetQuery: string) => {
        setActivePreset(presetQuery);
        setDiscoverQuery('');
        fetchRecommendations(presetQuery);
    };

    const handleDiscoverSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!discoverQuery.trim()) return;
        fetchRecommendations(discoverQuery.trim());
    };

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

    // Filter and Sort Logic for My Music List
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
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Top Bar: Title, Badges, Tabs, Random Play & Quick Add Input */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/10 pb-4">
                {/* Title, Badges & Tabs */}
                <div className="flex flex-wrap items-center gap-3">


                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-white/10">
                        <button
                            onClick={() => handleTabChange('my-list')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                activeTab === 'my-list'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            <ListMusic size={14} />
                            <span>My Music ({musicList.length})</span>
                        </button>

                        <button
                            onClick={() => handleTabChange('discover')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                activeTab === 'discover'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            <Compass size={14} />
                            <span>Discover</span>
                        </button>
                    </div>

                    {musicList.length > 0 && (
                        <button
                            onClick={handlePlayRandom}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                        >
                            <Play size={12} className="fill-white" />
                            <span>Random Play</span>
                        </button>
                    )}
                </div>

                {/* Inline Add Track Form */}
                {activeTab === 'my-list' && (
                    <form onSubmit={handleAddVideo} className="flex items-center gap-2 w-full lg:w-auto lg:max-w-md">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                                <Link2 size={15} />
                            </div>
                            <input
                                type="text"
                                value={inputUrl}
                                onChange={e => setInputUrl(e.target.value)}
                                placeholder="Paste YouTube Music Video Link..."
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
                                    <span>Add Track</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* TAB 1: MY MUSIC LIST */}
            {activeTab === 'my-list' && (
                <div className="space-y-4">
                    {/* Toolbar: Search & Sort */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
                        <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                            <Disc size={14} className="text-emerald-500" />
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
                                    className="w-full pl-8 pr-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
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
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <Music size={32} />
                            </div>
                            <div className="max-w-md space-y-1">
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                    {searchQuery ? 'No matching music videos found' : 'Your Music List is empty'}
                                </h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {searchQuery
                                        ? 'Try adjusting your search query.'
                                        : 'Paste a YouTube music video link above or switch to the Discover tab to find recommended tracks!'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: DISCOVER & RECOMMENDATIONS */}
            {activeTab === 'discover' && (
                <div className="space-y-4">
                    {/* Discover Controls: Preset Chips & Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 pb-1">
                        <form onSubmit={handleDiscoverSearch} className="flex items-center gap-2 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                                    <Search size={15} />
                                </div>
                                <input
                                    type="text"
                                    value={discoverQuery}
                                    onChange={e => setDiscoverQuery(e.target.value)}
                                    placeholder="Search YouTube music, artist, genre..."
                                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs transition-all"
                                    disabled={isFetchingRecs}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isFetchingRecs || !discoverQuery.trim()}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                                {isFetchingRecs ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <span>Discover</span>
                                )}
                            </button>
                        </form>

                        {/* Genre Presets */}
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1">
                            {GENRE_PRESETS.map((preset) => {
                                const isActive = activePreset === preset.query;
                                return (
                                    <button
                                        key={preset.label}
                                        onClick={() => handlePresetClick(preset.query)}
                                        disabled={isFetchingRecs}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                                            isActive
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recommendations Feed Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300">
                            <Sparkles size={14} className="text-emerald-500" />
                            <span>
                                {activePreset ? `Results for "${GENRE_PRESETS.find(p => p.query === activePreset)?.label || activePreset}"` : 'Personalized Recommendations'}
                            </span>
                        </div>
                        <span className="text-xs text-neutral-400">
                            Click 🎵 on any card to save to My Music List
                        </span>
                    </div>

                    {/* Recommendations Grid */}
                    {isFetchingRecs ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-3">
                            <Loader2 size={36} className="text-neutral-400 animate-spin" />
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                Fetching fresh music recommendations from YouTube...
                            </p>
                        </div>
                    ) : recommendations.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {recommendations.map(video => (
                                <VideoCard
                                    key={video.id}
                                    video={video}
                                    onPlay={() => handlePlayVideo(video.id, true)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-4 bg-neutral-50 dark:bg-neutral-900/40 border border-dashed border-neutral-300 dark:border-white/10 rounded-2xl text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                                <Compass size={32} />
                            </div>
                            <div className="max-w-md space-y-1">
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                    No music videos found
                                </h3>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Try selecting a genre preset or typing a search query above.
                                </p>
                            </div>
                        </div>
                    )}
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
