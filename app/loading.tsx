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

            {/* Sidebar Skeleton */}
            <div className="w-80 border-r border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-neutral-900/50 flex-shrink-0 hidden md:block overflow-y-auto">
                <div className="p-6 h-auto flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-500 dark:from-white dark:to-neutral-400">
                            MyTube
                        </h1>
                    </div>
                </div>

                <div className="px-4 pb-4 space-y-6">
                    {/* Interests Skeleton */}
                    <div>
                        <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800/50 rounded-xl animate-pulse"></div>
                            <div className="h-10 w-full bg-neutral-200 dark:bg-neutral-800/50 rounded-xl animate-pulse delay-75"></div>
                        </div>
                    </div>

                    {/* Channels Skeleton */}
                    <div>
                        <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse mb-4"></div>
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center gap-3 px-2 py-2">
                                    <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                                    <div className="h-3 flex-1 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto w-full relative pt-16 md:pt-0 p-4 md:p-8 bg-white dark:bg-black">
                <Loader />
            </main>
        </div>
    );
}
