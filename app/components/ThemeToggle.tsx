"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-9 h-9" />; // Placeholder to prevent hydration mismatch
    }

    const isDark = theme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="group relative p-2 rounded-xl transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-white/5 active:scale-95 border border-transparent hover:border-neutral-200 dark:hover:border-white/10"
            aria-label="Toggle theme"
        >
            <div className="relative">
                <Sun
                    size={20}
                    className={`transition-all duration-300 ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100 text-amber-500'}`}
                />
                <Moon
                    size={20}
                    className={`absolute top-0 left-0 transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100 text-indigo-400' : '-rotate-90 scale-0 opacity-0'}`}
                />
            </div>
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}
