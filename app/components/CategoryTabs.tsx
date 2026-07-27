'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Category } from '../lib/types';

interface CategoryTabsProps {
    categories: Category[];
}

export default function CategoryTabs({ categories }: CategoryTabsProps) {
    const searchParams = useSearchParams();
    const currentCategoryId = searchParams.get('categoryId');
    const currentChannelId = searchParams.get('channelId');

    const focusCategory = categories.find(c => c.name.trim().toLowerCase() === 'focus');

    const activeCategoryId = currentCategoryId
        ? (currentCategoryId === 'all' ? null : currentCategoryId)
        : (!currentChannelId && focusCategory ? focusCategory.id : null);

    const isAll = currentCategoryId === 'all' || (!currentCategoryId && !currentChannelId && !focusCategory);

    // Custom categories created by user
    const customCategories = categories.filter(c => c.id !== 'uncategorized');

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none border-b border-neutral-200 dark:border-white/5">
            <Link
                href="/feed?categoryId=all"
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center justify-center ${
                    isAll
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md scale-105'
                        : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white'
                }`}
            >
                Home (All Categories)
            </Link>

            {customCategories.map((category) => {
                const isActive = activeCategoryId === category.id;
                return (
                    <Link
                        key={category.id}
                        href={`/feed?categoryId=${category.id}`}
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
    );
}
