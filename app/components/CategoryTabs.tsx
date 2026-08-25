'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Category } from '../lib/types';
import { ABUNDANCE_FEED_ID } from '../lib/curatedFeeds';
import Loader from './Loader';

interface CategoryTabsProps {
    categories: Category[];
}

export default function CategoryTabs({ categories }: CategoryTabsProps) {
    const searchParams = useSearchParams();
    const [pendingHref, setPendingHref] = useState<string | null>(null);
    const currentCategoryId = searchParams.get('categoryId');
    const currentChannelId = searchParams.get('channelId');

    const focusCategory = categories.find(c => c.name.trim().toLowerCase() === 'focus');

    const activeCategoryId = currentCategoryId
        ? (currentCategoryId === 'all' ? null : currentCategoryId)
        : (!currentChannelId && focusCategory ? focusCategory.id : null);

    const isAll = currentCategoryId === 'all' || (!currentCategoryId && !currentChannelId && !focusCategory);
    const isAbundance = currentCategoryId === ABUNDANCE_FEED_ID;
    const activeHref = isAll
        ? '/feed?categoryId=all'
        : activeCategoryId
            ? `/feed?categoryId=${activeCategoryId}`
            : null;
    const isNavigating = pendingHref !== null && pendingHref !== activeHref;

    // Custom categories created by user
    const customCategories = categories.filter(c => c.id !== 'uncategorized');

    const beginNavigation = (href: string, isActive: boolean) => {
        if (!isActive) {
            setPendingHref(href);
        }
    };

    return (
        <>
            <div
                className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none border-b border-neutral-200 dark:border-white/5"
                aria-busy={isNavigating}
            >
                <Link
                    href="/feed?categoryId=all"
                    onNavigate={() => beginNavigation('/feed?categoryId=all', isAll)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center ${
                        isAll
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md scale-105'
                            : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                >
                    Home (All Categories)
                </Link>

                <Link
                    href={`/feed?categoryId=${ABUNDANCE_FEED_ID}`}
                    onNavigate={() => beginNavigation(`/feed?categoryId=${ABUNDANCE_FEED_ID}`, isAbundance)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        isAbundance
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md scale-105'
                            : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                >
                    Abundance
                </Link>

                {customCategories.map((category) => {
                    const isActive = activeCategoryId === category.id;
                    const href = `/feed?categoryId=${category.id}`;
                    return (
                        <Link
                            key={category.id}
                            href={href}
                            onNavigate={() => beginNavigation(href, isActive)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                isActive
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md scale-105'
                                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            {category.name}
                        </Link>
                    );
                })}
            </div>

            {isNavigating && (
                <div className="absolute inset-0 z-20 flex items-start justify-center bg-white/80 pt-20 backdrop-blur-[2px] dark:bg-black/80">
                    <Loader compact />
                </div>
            )}
        </>
    );
}
