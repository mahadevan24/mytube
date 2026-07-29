'use client';

import { registerUser } from '../actions';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import Link from 'next/link';
import { Key, User, Lock, HelpCircle, ArrowRight, CheckCircle2, Youtube, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all ${
                pending ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'
            }`}
        >
            {pending ? (
                <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Creating Your Account...
                </>
            ) : (
                <>
                    Create Account & Get Started
                    <ArrowRight className="w-4 h-4" />
                </>
            )}
        </button>
    );
}

export default function OnboardPage() {
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showGuide, setShowGuide] = useState<boolean>(false);

    async function clientAction(formData: FormData) {
        setErrorMessage('');
        const result = await registerUser(formData);
        if (result?.error) {
            setErrorMessage(result.error);
        }
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-300">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl mb-4">
                    <Youtube className="w-10 h-10 text-emerald-500" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                    Welcome to MyTube
                </h1>
                <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                    Set up your multi-user account to enjoy your personal YouTube dashboard without algorithms or clutter.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-xl dark:shadow-2xl rounded-2xl border border-neutral-200 dark:border-white/10 space-y-6">
                    
                    {/* Setup Information Banner */}
                    <div className="bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200 dark:border-white/10 rounded-xl p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <h3 className="font-semibold text-neutral-900 dark:text-white">Why set up a personal account?</h3>
                                <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                                    Each account stores its own channels, categories, watchlist, and custom YouTube API key so you get dedicated API limits and a private feed.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form action={clientAction} className="space-y-5">
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm" role="alert">
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Username Input */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Username <span className="text-emerald-500">*</span>
                            </label>
                            <div className="mt-1.5 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                                    <User className="h-4 w-4" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    placeholder="choose a username"
                                    className="block w-full pl-10 px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700/80 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-colors"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Password <span className="text-emerald-500">*</span>
                                </label>
                                <div className="mt-1.5 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="at least 6 characters"
                                        className="block w-full pl-10 px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700/80 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Confirm Password <span className="text-emerald-500">*</span>
                                </label>
                                <div className="mt-1.5 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        placeholder="re-enter password"
                                        className="block w-full pl-10 px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700/80 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* YouTube API Key Section */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="youtubeApiKey" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    YouTube Data API Key <span className="text-neutral-500 dark:text-neutral-400 font-normal">(Optional)</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowGuide(!showGuide)}
                                    className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    {showGuide ? 'Hide guide' : 'How to get a key?'}
                                </button>
                            </div>
                            <div className="mt-1.5 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                                    <Key className="h-4 w-4" />
                                </div>
                                <input
                                    id="youtubeApiKey"
                                    name="youtubeApiKey"
                                    type="text"
                                    placeholder="AIzaSy..."
                                    className="block w-full pl-10 px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700/80 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-mono transition-colors"
                                />
                            </div>
                            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                                Providing your own key guarantees dedicated daily quota. If left blank, system default key will be used.
                            </p>
                        </div>

                        {/* Expandable YouTube API Key Guide */}
                        {showGuide && (
                            <div className="bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700 rounded-xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <h4 className="font-semibold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
                                    <Youtube className="w-4 h-4 text-emerald-500" />
                                    How to obtain your free YouTube Data API Key
                                </h4>
                                <ol className="list-decimal list-inside space-y-1.5 text-neutral-700 dark:text-neutral-300">
                                    <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700 dark:hover:text-emerald-300">Google Cloud Console</a>.</li>
                                    <li>Create a new project (e.g. <em>"MyTube Dashboard"</em>).</li>
                                    <li>Navigate to <strong>APIs & Services</strong> &gt; <strong>Library</strong>.</li>
                                    <li>Search for <strong>YouTube Data API v3</strong> and click <strong>Enable</strong>.</li>
                                    <li>Go to <strong>Credentials</strong> &gt; <strong>Create Credentials</strong> &gt; <strong>API Key</strong>.</li>
                                    <li>Copy the generated key (starts with <code className="bg-neutral-200 dark:bg-neutral-900 px-1 py-0.5 rounded text-neutral-900 dark:text-white">AIza...</code>) and paste it into the field above.</li>
                                </ol>
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 pt-1">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>Google gives 10,000 free quota units daily for personal use!</span>
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <SubmitButton />
                        </div>
                    </form>

                    {/* Footer link to login */}
                    <div className="pt-4 border-t border-neutral-200 dark:border-white/10 text-center text-sm text-neutral-600 dark:text-neutral-400">
                        Already have an account?{' '}
                        <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-4 transition-colors">
                            Log in with Username & Password
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
