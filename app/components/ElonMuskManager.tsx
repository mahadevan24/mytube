'use client';

import { useState, useTransition } from 'react';
import { Video } from '../lib/types';
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import { getElonMuskVideosAction } from '../actions';
import { Search, Sparkles, Rocket, Mic, Tv, Flame, RefreshCw, Cpu, Globe } from 'lucide-react';

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

    const handleQuickTopic = (topic: string) => {
        setSearchQuery(topic);
        setActiveSearchTerm(topic);
        startTransition(async () => {
            const fetched = await getElonMuskVideosAction(activeFilter, topic);
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
            {/* Elon Musk HQ Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-black p-6 md:p-8 border border-neutral-800 text-white shadow-2xl">
                <div className="absolute -right-12 -top-12 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-600/20 text-red-500 border border-red-500/30 rounded-2xl shadow-inner">
                                <Rocket size={28} className="animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs uppercase tracking-widest text-red-400 font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                                        Special Edition Tab
                                    </span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                                    Elon Musk Vault
                                </h1>
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={isPending}
                            className="px-4 py-2 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-white/10 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
                            <span>Refresh Vault</span>
                        </button>
                    </div>

                    <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
                        Curated recent keynotes, deep-dive interviews, and podcast appearances by Elon Musk across SpaceX, Tesla, xAI, Neuralink, and X.
                    </p>

                    {/* Preset Topic Tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="text-xs font-medium text-neutral-500 flex items-center gap-1 mr-1">
                            <Sparkles size={12} className="text-amber-400" /> Topics:
                        </span>
                        {[
                            { name: 'SpaceX & Starship', topic: 'SpaceX Starship Mars' },
                            { name: 'xAI & Grok', topic: 'xAI Grok AI' },
                            { name: 'Tesla & FSD', topic: 'Tesla FSD Robotaxi' },
                            { name: 'Lex Fridman', topic: 'Lex Fridman' },
                            { name: 'Joe Rogan', topic: 'Joe Rogan' },
                            { name: 'Neuralink', topic: 'Neuralink brain' },
                        ].map((t) => (
                            <button
                                key={t.name}
                                onClick={() => handleQuickTopic(t.topic)}
                                className={`text-xs px-3 py-1 rounded-full transition-all border ${
                                    activeSearchTerm === t.topic
                                        ? 'bg-red-600 text-white border-red-500 shadow-md font-semibold'
                                        : 'bg-neutral-900/80 text-neutral-300 border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800'
                                }`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Controls Bar: Filters & Search */}
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

                {/* Sub-search input */}
                <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
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
