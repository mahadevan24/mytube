import { Suspense } from 'react';
import { Layers } from 'lucide-react';
import FeedFetcher, { resolveFeedScope } from '../../components/FeedFetcher';
import Loader from '../../components/Loader';
import CategoryTabs from '../../components/CategoryTabs';
import TabVideoSearch from '../../components/TabVideoSearch';
import { getStoredInterests } from '../../lib/storage';
import { ABUNDANCE_FEED_ID } from '../../lib/curatedFeeds';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FeedPage({ searchParams }: PageProps) {
  const [resolvedSearchParams, interests] = await Promise.all([
    searchParams,
    getStoredInterests(),
  ]);
  const hasInterests = interests.channels.length > 0;
  const isAbundanceFeed = resolvedSearchParams.categoryId === ABUNDANCE_FEED_ID;
  const scope = resolveFeedScope(interests, resolvedSearchParams);

  if (!hasInterests && !isAbundanceFeed) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-700">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-white/5 dark:bg-neutral-900/80">
          <Layers size={48} className="text-neutral-900 dark:text-white" />
        </div>
        <div className="max-w-md space-y-2 px-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Your Personal Dashboard</h2>
          <p className="leading-relaxed text-neutral-500">
            Open the sidebar and add your favorite YouTube channels to build your personal feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[50vh]">
      {(interests.categories?.length > 0 || isAbundanceFeed) && (
        <CategoryTabs categories={interests.categories} />
      )}

      {hasInterests && (
        <TabVideoSearch
          key={scope.searchQuery || ''}
          scopeName={scope.scopeName}
          channelCount={scope.scopeChannels.length}
          initialQuery={scope.searchQuery}
        />
      )}

      <Suspense key={JSON.stringify(resolvedSearchParams)} fallback={<Loader />}>
        <FeedFetcher interests={interests} scope={scope} />
      </Suspense>
    </div>
  );
}

export const dynamic = 'force-dynamic';
