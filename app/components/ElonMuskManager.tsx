'use client';

import { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { Video } from '../lib/types';
import VideoCard from './VideoCard';
import { getElonMuskVideosAction } from '../actions';
import { Search, Mic, Tv, Flame, RefreshCw, Cpu, Globe } from 'lucide-react';

const VideoModal = dynamic(() => import('./VideoModal'), { ssr: false });

interface ElonMuskManagerProps {
    initialVideos: Video[];
}

type ElonFilter = 'all' | 'talks' | 'interviews' | 'podcasts';

export default function ElonMuskManager({ initialVideos }: ElonMuskManagerProps) {
    const [videos, setVideos] = useState<Video[]>(initialVideos);
    const [activeFilter, setActiveFilter] = useState<ElonFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearchTerm, setActiveSearchTerm] = useState('');
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleFilterChange = (filter: ElonFilter) => {
        setActiveFilter(filter);
        setSearchQuery('');
        setActiveSearchTerm('');
        startTransition(async () => {
            const fetched = await getElonMuskVideosAction(filter);
            setVideos(fetched);
        });
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim() && !activeSearchTerm) return;

        const queryToUse = searchQuery.trim();
        setActiveSearchTerm(queryToUse);

        startTransition(async () => {
            const fetched = await getElonMuskVideosAction(activeFilter, queryToUse);
            setVideos(fetched);
        });
    };

    const handleRefresh = () => {
        startTransition(async () => {
            const fetched = await getElonMuskVideosAction(activeFilter, activeSearchTerm);
            setVideos(fetched);
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {/* Controls Bar: Filters, Search & Refresh */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-white/10 pb-4">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {[
                        { id: 'all', label: 'All Content', icon: Flame },
                        { id: 'talks', label: 'Talks & Keynotes', icon: Tv },
                        { id: 'interviews', label: 'Interviews', icon: Cpu },
                        { id: 'podcasts', label: 'Podcasts', icon: Mic },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleFilterChange(tab.id as ElonFilter)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                                    isActive
                                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-md scale-[1.02]'
                                        : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                            >
                                <Icon size={14} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search & Refresh */}
                <div className="flex items-center gap-2">
                    <form onSubmit={handleSearchSubmit} className="relative sm:w-72 flex-1 sm:flex-initial">
                        <input
                            type="text"
                            placeholder="Filter Elon talks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-500 rounded-xl text-xs border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                        />
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveSearchTerm('');
                                    startTransition(async () => {
                                        const fetched = await getElonMuskVideosAction(activeFilter, '');
                                        setVideos(fetched);
                                    });
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                            >
                                ×
                            </button>
                        )}
                    </form>

                    <button
                        onClick={handleRefresh}
                        disabled={isPending}
                        title="Refresh feed"
                        className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={isPending ? 'animate-spin text-red-500' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* Loading Overlay State */}
            {isPending && (
                <div className="flex items-center justify-center py-12 text-neutral-500 space-x-3">
                    <RefreshCw size={20} className="animate-spin text-red-500" />
                    <span className="text-sm font-medium">Loading Elon Musk vault items...</span>
                </div>
            )}

            {/* Video Grid */}
            {!isPending && videos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.map((video) => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            onPlay={(id) => setActiveVideoId(id)}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isPending && videos.length === 0 && (
                <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-900/40 rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 space-y-4">
                    <div className="w-16 h-16 mx-auto bg-neutral-200 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-neutral-500">
                        <Globe size={32} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white">No videos found</h3>
                        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                            No recent Elon Musk videos matched your current filter or search term. Try switching category tabs or clearing search.
                        </p>
                    </div>
                    <button
                        onClick={() => handleFilterChange('all')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                        Reset All Filters
                    </button>
                </div>
            )}

            {/* Video Modal Player */}
            {activeVideoId && (
                <VideoModal
                    videoId={activeVideoId}
                    onClose={() => setActiveVideoId(null)}
                />
            )}
        </div>
    );
}
