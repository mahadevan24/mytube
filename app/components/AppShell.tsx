'use client';

import { useState, useEffect } from 'react';
import { Menu, X, PanelLeftClose, PanelLeftOpen, Layers } from 'lucide-react';


interface AppShellProps {
    sidebar: React.ReactNode;
    children: React.ReactNode;
    themeToggle: React.ReactNode;
    isEmpty: boolean;
}

export default function AppShell({ sidebar, children, themeToggle, isEmpty }: AppShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

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
                    <h1 className="text-lg font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-500 dark:from-white dark:to-neutral-400">
                        MyTube
                    </h1>
                </div>
                {themeToggle}
            </header>

            {/* MOBILE SIDEBAR OVERLAY */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                        className="absolute top-16 left-0 bottom-0 w-3/4 max-w-sm bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-white/5 shadow-2xl p-4 animate-in slide-in-from-left duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {sidebar}
                    </div>
                </div>
            )}

            {/* DESKTOP SIDEBAR */}
            <aside
                className={`hidden md:flex flex-col border-r border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-neutral-900/50 transition-all duration-300 ease-in-out relative
                 ${isDesktopSidebarOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0 overflow-hidden border-none'}`}
            >
                <div className="p-6 flex items-center justify-between flex-shrink-0">
                    <h1 className="text-xl font-bold tracking-wide flex items-center gap-3 whitespace-nowrap overflow-hidden">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-500 dark:from-white dark:to-neutral-400">MyTube</span>
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
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto w-full relative pt-16 md:pt-0">

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
