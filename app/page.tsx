import { Suspense } from 'react';
import InterestManager from './components/InterestManager';
import FeedFetcher from './components/FeedFetcher';
import Loader from './components/Loader';
import ThemeToggle from './components/ThemeToggle';
import AppShell from './components/AppShell';
import { getStoredInterests } from './lib/storage';

// PageProps type for Next.js 15+ (where params/searchParams are promises)
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  // We still need to check emptiness for the AppShell state, 
  // but we can let FeedFetcher handle the heavy lifting for videos.
  // This is a lightweight read.
  const interests = await getStoredInterests();
  const hasInterests = interests.channels.length > 0;

  return (
    <AppShell
      sidebar={<InterestManager />}
      themeToggle={<ThemeToggle />}
      isEmpty={!hasInterests}
    >
      {/* 
        Key forces re-render (and thus fallback) when params change. 
        JSON.stringify is consistent for object comparison here.
      */}
      <Suspense key={JSON.stringify(resolvedSearchParams)} fallback={<Loader />}>
        <FeedFetcher searchParams={resolvedSearchParams} />
      </Suspense>
    </AppShell>
  );
}
