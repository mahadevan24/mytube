import { Suspense } from 'react';
import { Layers } from 'lucide-react';
import FeedFetcher from '../../components/FeedFetcher';
import Loader from '../../components/Loader';
import { getStoredInterests } from '../../lib/storage';
import { ABUNDANCE_FEED_ID } from '../../lib/curatedFeeds';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FeedPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const interests = await getStoredInterests();
  const hasInterests = interests.channels.length > 0;
  const isAbundanceFeed = resolvedSearchParams.categoryId === ABUNDANCE_FEED_ID;

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
    <Suspense key={JSON.stringify(resolvedSearchParams)} fallback={<Loader />}>
      <FeedFetcher searchParams={resolvedSearchParams} />
    </Suspense>
  );
}
