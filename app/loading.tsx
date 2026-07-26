import Loader from './components/Loader';

export default function Loading() {
    return (
        <div className="flex h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">

            {/* Mobile Header Skeleton */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
                    <div className="h-5 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"></div>
                </div>
                <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
            </header>

            <main className="flex-1 overflow-y-auto w-full relative pt-16 md:pt-0 scroll-smooth">
                {/* Desktop Expand Header Bar Skeleton (matching closed sidebar default state) */}
                <header className="hidden md:flex sticky top-0 z-30 h-14 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200/80 dark:border-white/5 items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
                        <div className="h-5 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"></div>
                    </div>
                    <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto relative z-10 min-h-full">
                    <Loader />
                </div>
            </main>
        </div>
    );
}

