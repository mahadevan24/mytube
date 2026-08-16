import { Suspense } from 'react';
import InterestManager from '../components/InterestManager';
import FeedFetcher from '../components/FeedFetcher';
import Loader from '../components/Loader';
import ThemeToggle from '../components/ThemeToggle';
import AppShell from '../components/AppShell';
import { getStoredInterests } from '../lib/storage';
import { ABUNDANCE_FEED_ID } from '../lib/curatedFeeds';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FeedPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const interests = await getStoredInterests();
  const hasInterests = interests.channels.length > 0;
  const isAbundanceFeed = resolvedSearchParams.categoryId === ABUNDANCE_FEED_ID;

  return (
    <AppShell
      sidebar={<InterestManager />}
      themeToggle={<ThemeToggle />}
      isEmpty={!hasInterests && !isAbundanceFeed}
    >
      <Suspense key={JSON.stringify(resolvedSearchParams)} fallback={<Loader />}>
        <FeedFetcher searchParams={resolvedSearchParams} />
      </Suspense>
    </AppShell>
  );
}
