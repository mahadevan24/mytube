'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, X, PanelLeftClose, PanelLeftOpen, Layers, ArrowUp } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';

interface AppShellProps {
    sidebar: React.ReactNode;
    children: React.ReactNode;
    themeToggle: React.ReactNode;
    isEmpty: boolean;
}

export default function AppShell({ sidebar, children, themeToggle, isEmpty }: AppShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

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
        setIsMobileMenuOpen(false);
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
        <div className="flex h-screen bg-white dark:bg-black text-neutral-900 dark:text-white font-sans overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">

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
                {themeToggle}
            </header>

            {/* MOBILE SIDEBAR OVERLAY */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                        className="absolute top-16 left-0 bottom-0 w-3/4 max-w-sm bg-gradient-to-br from-neutral-50 via-green-50/15 to-yellow-50/10 dark:from-neutral-900 dark:via-green-950/10 dark:to-yellow-950/5 border-r border-neutral-200 dark:border-white/5 shadow-2xl p-4 animate-in slide-in-from-left duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {sidebar}
                    </div>
                </div>
            )}

            {/* DESKTOP SIDEBAR */}
            <aside
                ref={sidebarRef}
                style={{ width: isDesktopSidebarOpen ? sidebarWidth : 0 }}
                className={`hidden md:flex flex-col border-r border-neutral-200 dark:border-white/5 bg-gradient-to-br from-neutral-50 via-green-50/15 to-yellow-50/10 dark:from-neutral-900 dark:via-green-950/10 dark:to-yellow-950/5 transition-all duration-300 ease-in-out relative
                 ${isDesktopSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 overflow-hidden border-none'}`}
            >
                <div className="px-6 py-6 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-green-500/5 via-yellow-500/3 to-lime-500/5 dark:from-green-500/3 dark:via-yellow-500/2 dark:to-lime-500/3">
                    <h1 className="text-xl font-bold tracking-wide text-neutral-900 dark:text-white flex items-center gap-3 whitespace-nowrap overflow-hidden m-0">
                        MyTube
                    </h1>
                    <div className="flex items-center gap-2">
                        {themeToggle}
                        <button
                            onClick={() => setIsDesktopSidebarOpen(false)}
                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1"
                            title="Collapse Sidebar"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    {sidebar}
                </div>

                {/* Drag Handle */}
                {isDesktopSidebarOpen && (
                    <div
                        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-green-400/30 transition-colors z-10 ${isResizing ? 'bg-green-400/40' : ''}`}
                        onMouseDown={startResizing}
                    />
                )}
            </aside>

            {/* MAIN CONTENT AREA */}
            <main ref={mainRef} className="flex-1 overflow-y-auto w-full relative pt-16 md:pt-0 scroll-smooth">

                {/* Desktop Expand Button (Floating/Fixed) */}
                {!isDesktopSidebarOpen && (
                    <button
                        onClick={() => setIsDesktopSidebarOpen(true)}
                        className="hidden md:flex absolute top-4 left-4 z-30 p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-lg rounded-lg text-neutral-500 hover:text-indigo-500 transition-all hover:scale-105"
                        title="Open Sidebar"
                    >
                        <PanelLeftOpen size={20} />
                    </button>
                )}

                {/* Back to Top Button */}
                <button
                    onClick={scrollToTop}
                    className={`fixed bottom-8 right-8 z-50 p-3 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 hover:scale-110 transition-all duration-300 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
                    title="Back to Top"
                >
                    <ArrowUp size={24} />
                </button>



                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/5 to-transparent pointer-events-none -z-10"></div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto relative z-10 min-h-full">
                    {isEmpty ? (
                        <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6 animate-in fade-in duration-700">
                            <div className="w-24 h-24 bg-white dark:bg-neutral-900/80 rounded-3xl flex items-center justify-center border border-neutral-200 dark:border-white/5 shadow-2xl">
                                <Layers size={48} className="text-indigo-500" />
                            </div>
                            <div className="space-y-2 max-w-md px-4">
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Your Personal Dashboard</h2>
                                <p className="text-neutral-500 leading-relaxed">
                                    This dashboard is empty because you haven&apos;t added any interests yet.
                                    {isDesktopSidebarOpen
                                        ? " Use the sidebar to add your favorite YouTube channels."
                                        : " Open the sidebar to add your favorite YouTube channels."}
                                    <span className="block mt-2 md:hidden text-indigo-400 text-sm">Tap the menu icon to get started.</span>
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
