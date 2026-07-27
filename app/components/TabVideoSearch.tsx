'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';

interface TabVideoSearchProps {
    scopeName: string;
    channelCount: number;
    initialQuery?: string;
    onInstantFilterChange?: (query: string) => void;
}

export default function TabVideoSearch({
    scopeName,
    channelCount,
    initialQuery = '',
    onInstantFilterChange,
}: TabVideoSearchProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [query, setQuery] = useState(initialQuery);
    const [isPending, startTransition] = useTransition();

    // Keep internal query state in sync with URL searchParams
    useEffect(() => {
        const urlQuery = searchParams.get('q') || '';
        setQuery(urlQuery);
    }, [searchParams]);

    const updateUrlQuery = (newQuery: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newQuery.trim()) {
            params.set('q', newQuery.trim());
        } else {
            params.delete('q');
        }
        
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (onInstantFilterChange) {
            onInstantFilterChange(val);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateUrlQuery(query);
    };

    const handleClear = () => {
        setQuery('');
        if (onInstantFilterChange) {
            onInstantFilterChange('');
        }
        updateUrlQuery('');
    };

    const activeUrlQuery = searchParams.get('q') || '';

    return (
        <div className="mb-5">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400">
                    {isPending ? (
                        <Loader2 size={16} className="animate-spin text-neutral-400" />
                    ) : (
                        <Search size={16} />
                    )}
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder={`Search in ${scopeName} (${channelCount} ${channelCount === 1 ? 'channel' : 'channels'})...`}
                    className="w-full pl-10 pr-28 py-2 bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-full text-xs sm:text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-black transition-all shadow-sm"
                />

                <div className="absolute right-1.5 flex items-center gap-1">
                    {query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                            title="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={isPending || !query.trim()}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-xs rounded-full transition-all flex items-center justify-center active:scale-95 shadow-sm"
                        title="Search YouTube"
                    >
                        <span>Search</span>
                    </button>
                </div>
            </form>

            {activeUrlQuery && (
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-3">
                    <span>
                        Results for <strong className="text-neutral-900 dark:text-white font-semibold">&quot;{activeUrlQuery}&quot;</strong> in {scopeName}
                    </span>
                    <button
                        onClick={handleClear}
                        className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:underline font-medium"
                    >
                        Clear search
                    </button>
                </div>
            )}
        </div>
    );
}

