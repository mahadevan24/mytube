'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, PanelLeftClose, PanelLeftOpen, Layers, ArrowUp, Tv, ListVideo, Music, Rocket, LogOut } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { logout } from '../actions';

const InterestManager = dynamic(() => import('./InterestManager'), {
    ssr: false,
    loading: () => <div className="p-4 text-sm text-neutral-500">Loading channels…</div>,
});

interface AppShellProps {
    children: React.ReactNode;
    themeToggle: React.ReactNode;
    isEmpty: boolean;
}

export default function AppShell({ children, themeToggle, isEmpty }: AppShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);

    // Resizable Sidebar State
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLElement>(null);
    const mainRef = useRef<HTMLElement>(null);

    // Back to Top State
    const [showBackToTop, setShowBackToTop] = useState(false);

    // Navigation Hooks for Auto-close
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-close mobile menu on navigation
    useEffect(() => {
        const animationFrame = requestAnimationFrame(() => setIsMobileMenuOpen(false));
        return () => cancelAnimationFrame(animationFrame);
    }, [pathname, searchParams]);

    // Scroll Listener for Back to Top
    useEffect(() => {
        const main = mainRef.current;
        if (!main) return;

        const handleScroll = () => {
            if (main.scrollTop > 300) {
                setShowBackToTop(true);
            } else {
                setShowBackToTop(false);
            }
        };

        main.addEventListener('scroll', handleScroll);
        return () => main.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Resizing Logic
    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const resize = (e: MouseEvent) => {
            if (isResizing) {
                let newWidth = e.clientX;
                if (newWidth < 240) newWidth = 240; // Min width
                if (newWidth > 600) newWidth = 600; // Max width
                setSidebarWidth(newWidth);
            }
        };

        const stopResizing = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none'; // Prevent text selection
        } else {
            document.body.style.cursor = 'auto';
            document.body.style.userSelect = 'auto';
        }

        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            document.body.style.cursor = 'auto'; // cleanup
            document.body.style.userSelect = 'auto';
        };
    }, [isResizing]);


    return (
        <div className="flex h-screen bg-white dark:bg-black text-neutral-900 dark:text-white font-sans overflow-hidden selection:bg-neutral-800 selection:text-white">

            {/* MOBILE / TABLET HEADER */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/5 z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 -ml-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <h1 className="text-xl font-bold tracking-wide text-neutral-900 dark:text-white">
                        MyTube
                    </h1>
                </div>
                <div className="flex items-center gap-1.5">
                    <Link
                        href="/feed"
                        className={`p-2 rounded-lg transition-colors ${pathname === '/feed' ? 'text-neutral-900 dark:text-white font-bold bg-neutral-100 dark:bg-white/10' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                        title="Feed"
                    >
                        <Tv size={18} />
                    </Link>
                    <Link
                        href="/watchlist"
                        className={`p-2 rounded-lg transition-colors ${pathname === '/watchlist' ? 'text-neutral-900 dark:text-white font-bold bg-neutral-100 dark:bg-white/10' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                        title="Watchlist"
                    >
                        <ListVideo size={18} />
                    </Link>
                    <Link
                        href="/music"
                        className={`p-2 rounded-lg transition-colors ${pathname === '/music' ? 'text-neutral-900 dark:text-white font-bold bg-neutral-100 dark:bg-white/10' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                        title="Music List"
                    >
                        <Music size={18} />
                    </Link>
                    <Link
                        href="/elon"
                        className={`p-2 rounded-lg transition-colors ${pathname === '/elon' ? 'text-neutral-900 dark:text-white font-bold bg-neutral-100 dark:bg-white/10' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'}`}
                        title="Elon Musk"
                    >
                        <Rocket size={18} />
                    </Link>
                    {themeToggle}
                </div>
            </header>

            {/* MOBILE SIDEBAR OVERLAY */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                        className="absolute top-16 left-0 bottom-0 w-3/4 max-w-sm bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-white/10 shadow-2xl p-3 animate-in slide-in-from-left duration-300 flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <InterestManager />
                    </div>
                </div>
            )}

            {/* DESKTOP SIDEBAR */}
            <aside
                ref={sidebarRef}
                style={{ width: isDesktopSidebarOpen ? sidebarWidth : 0 }}
                className={`hidden md:flex flex-col border-r border-neutral-200/80 dark:border-white/5 bg-neutral-50/50 dark:bg-neutral-950/60 backdrop-blur-md transition-all duration-300 ease-in-out relative
                 ${isDesktopSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 overflow-hidden border-none'}`}
            >
                <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-neutral-200/60 dark:border-white/5">
                    <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap overflow-hidden m-0">
                        MyTube
                    </h1>
                    <div className="flex items-center gap-1.5">
                        {themeToggle}
                        <button
                            onClick={() => setIsDesktopSidebarOpen(false)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-white/10 rounded-lg transition-colors"
                            title="Collapse Sidebar"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    {isDesktopSidebarOpen && <InterestManager />}
                </div>

                {/* Drag Handle */}
                {isDesktopSidebarOpen && (
                    <div
                        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-neutral-400 dark:hover:bg-white/40 transition-colors z-10 ${isResizing ? 'bg-neutral-500 dark:bg-white/50' : ''}`}
                        onMouseDown={startResizing}
                    />
                )}
            </aside>

            {/* MAIN CONTENT AREA */}
            <main ref={mainRef} className="flex-1 overflow-y-auto w-full relative pt-16 md:pt-0 scroll-smooth">

                {/* Desktop Expand Header Bar (when sidebar is closed) */}
                {!isDesktopSidebarOpen && (
                    <header className="hidden md:flex sticky top-0 z-30 h-14 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200/80 dark:border-white/5 items-center justify-between px-6 transition-all">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsDesktopSidebarOpen(true)}
                                className="p-2 -ml-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg transition-all flex items-center gap-2 group"
                                title="Open Sidebar"
                            >
                                <PanelLeftOpen size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-base text-neutral-900 dark:text-white tracking-tight">
                                    MyTube
                                </span>
                            </button>

                            <nav className="flex items-center gap-1 border-l border-neutral-200 dark:border-white/10 pl-4">
                                <Link
                                    href="/feed"
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${pathname === '/feed' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'}`}
                                >
                                    <Tv size={14} />
                                    <span>Personal Feed</span>
                                </Link>
                                <Link
                                    href="/watchlist"
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${pathname === '/watchlist' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'}`}
                                >
                                    <ListVideo size={14} />
                                    <span>Watchlist</span>
                                </Link>
                                <Link
                                    href="/music"
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${pathname === '/music' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'}`}
                                >
                                    <Music size={14} />
                                    <span>Music List</span>
                                </Link>
                                <Link
                                    href="/elon"
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${pathname === '/elon' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'}`}
                                >
                                    <Rocket size={14} />
                                    <span>Elon Musk</span>
                                </Link>
                            </nav>

                        </div>
                        <div className="flex items-center gap-2">
                            {themeToggle}
                            <button
                                onClick={() => logout()}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                                title="Log Out"
                            >
                                <LogOut size={15} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </header>
                )}


                {/* Back to Top Button */}
                <button
                    onClick={scrollToTop}
                    className={`fixed bottom-8 right-8 z-50 p-3 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:scale-110 transition-all duration-300 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
                    title="Back to Top"
                >
                    <ArrowUp size={24} />
                </button>



                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-neutral-200/20 dark:from-white/5 to-transparent pointer-events-none -z-10"></div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto relative z-10 min-h-full">
                    {isEmpty ? (
                        <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 animate-in fade-in duration-700">
                            <div className="w-24 h-24 bg-white dark:bg-neutral-900/80 rounded-3xl flex items-center justify-center border border-neutral-200 dark:border-white/5 shadow-2xl">
                                <Layers size={48} className="text-neutral-900 dark:text-white" />
                            </div>
                            <div className="space-y-2 max-w-md px-4">
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Your Personal Dashboard</h2>
                                <p className="text-neutral-500 leading-relaxed">
                                    This dashboard is empty because you haven&apos;t added any interests yet.
                                    {isDesktopSidebarOpen
                                        ? " Use the sidebar to add your favorite YouTube channels."
                                        : " Open the sidebar to add your favorite YouTube channels."}
                                    <span className="block mt-2 md:hidden text-neutral-600 dark:text-neutral-400 text-sm">Tap the menu icon to get started.</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            {children}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
