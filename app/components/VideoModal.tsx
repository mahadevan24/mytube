'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, RotateCcw, Play } from 'lucide-react';
import { getWatchProgress, saveWatchProgress, clearWatchProgress, formatSecondsToTimestamp } from '../lib/watchProgress';

interface VideoModalProps {
    videoId: string;
    onClose: () => void;
}

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export default function VideoModal({ videoId, onClose }: VideoModalProps) {
    const [mounted, setMounted] = useState(false);
    const [savedStartSeconds, setSavedStartSeconds] = useState<number>(0);
    const [currentSeconds, setCurrentSeconds] = useState<number>(0);
    const [isPlayingFromStart, setIsPlayingFromStart] = useState(false);
    const playerRef = useRef<any>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';

        // Check if there is saved progress for this video
        const progress = getWatchProgress(videoId);
        if (progress && progress.seconds > 5) {
            setSavedStartSeconds(progress.seconds);
            setCurrentSeconds(progress.seconds);
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [videoId, onClose]);

    // Setup YouTube IFrame API to track playback time
    useEffect(() => {
        if (!mounted) return;

        let player: any = null;

        const saveCurrentTime = () => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                const time = playerRef.current.getCurrentTime();
                const duration = typeof playerRef.current.getDuration === 'function' ? playerRef.current.getDuration() : undefined;
                if (typeof time === 'number' && time > 0) {
                    setCurrentSeconds(Math.floor(time));
                    saveWatchProgress(videoId, time, duration);
                }
            }
        };

        const startTracking = () => {
            stopTracking();
            intervalRef.current = setInterval(() => {
                saveCurrentTime();
            }, 2000);
        };

        const stopTracking = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        const initPlayer = () => {
            if (window.YT && window.YT.Player && iframeRef.current) {
                try {
                    player = new window.YT.Player(iframeRef.current, {
                        events: {
                            onReady: () => {
                                playerRef.current = player;
                            },
                            onStateChange: (event: any) => {
                                // 1 = PLAYING
                                if (event.data === 1) {
                                    startTracking();
                                } else {
                                    stopTracking();
                                    saveCurrentTime();
                                }
                            }
                        }
                    });
                } catch (err) {
                    console.error('Error initializing YT Player:', err);
                }
            }
        };

        // Load YouTube Iframe API if not loaded
        if (!window.YT || !window.YT.Player) {
            const existingScript = document.getElementById('youtube-iframe-api-script');
            if (!existingScript) {
                const tag = document.createElement('script');
                tag.id = 'youtube-iframe-api-script';
                tag.src = 'https://www.youtube.com/iframe_api';
                const firstScriptTag = document.getElementsByTagName('script')[0];
                if (firstScriptTag && firstScriptTag.parentNode) {
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                } else {
                    document.head.appendChild(tag);
                }
            }

            const prevCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (prevCallback) prevCallback();
                initPlayer();
            };
        } else {
            initPlayer();
        }

        return () => {
            stopTracking();
            saveCurrentTime();
            if (player && typeof player.destroy === 'function') {
                try {
                    player.destroy();
                } catch {}
            }
        };
    }, [mounted, videoId]);

    const handleRestart = () => {
        setIsPlayingFromStart(true);
        setSavedStartSeconds(0);
        setCurrentSeconds(0);
        clearWatchProgress(videoId);
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(0, true);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!mounted) return null;

    const startParam = !isPlayingFromStart && savedStartSeconds > 0 ? `&start=${savedStartSeconds}` : '';
    const iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1${startParam}`;
    const ytAppLink = `https://www.youtube.com/watch?v=${videoId}${currentSeconds > 0 ? `&t=${currentSeconds}s` : ''}`;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 md:p-10 animate-in fade-in duration-300"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-white/10 flex flex-col items-center justify-center">

                {/* Control bar / header overlay */}
                <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                    {/* Timestamp Resume Badge */}
                    {!isPlayingFromStart && savedStartSeconds > 0 ? (
                        <div className="pointer-events-auto flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full text-xs text-white shadow-lg animate-in slide-in-from-top-2">
                            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                                <Play size={12} className="fill-emerald-400" />
                                Resuming at {formatSecondsToTimestamp(savedStartSeconds)}
                            </span>
                            <button
                                onClick={handleRestart}
                                className="flex items-center gap-1 hover:bg-white/20 px-2 py-0.5 rounded-full text-[11px] text-neutral-300 transition-colors"
                                title="Start video from beginning"
                            >
                                <RotateCcw size={12} />
                                <span>Restart</span>
                            </button>
                        </div>
                    ) : (
                        <div />
                    )}

                    {/* Action buttons: Open in YouTube & Close */}
                    <div className="pointer-events-auto flex items-center gap-2">
                        <a
                            href={ytAppLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold rounded-full backdrop-blur-md transition-all hover:scale-105 shadow-md border border-red-500/30"
                            title="Open in YouTube app / website at current timestamp"
                        >
                            <ExternalLink size={14} />
                            <span className="hidden sm:inline">Open in YouTube</span>
                        </a>

                        <button
                            onClick={onClose}
                            className="p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all hover:scale-110 backdrop-blur-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <iframe
                    ref={iframeRef}
                    id="youtube-iframe-player"
                    className="w-full h-full"
                    src={iframeSrc}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            </div>
        </div>,
        document.body
    );
}
