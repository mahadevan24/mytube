'use client';

import { login } from '../actions';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import Link from 'next/link';
import { Youtube } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all ${
                pending ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'
            }`}
        >
            {pending ? 'Signing in...' : 'Sign in'}
        </button>
    );
}

export default function LoginPage() {
    const [errorMessage, setErrorMessage] = useState<string>('');

    async function clientAction(formData: FormData) {
        setErrorMessage('');
        const result = await login(formData);
        if (result?.error) {
            setErrorMessage(result.error);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-300">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl mb-4">
                    <Youtube className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                    MyTube Dashboard
                </h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    Log in with your username & password
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl py-8 px-6 shadow-xl dark:shadow-2xl rounded-2xl border border-neutral-200 dark:border-white/10 sm:px-10 space-y-6">
                    <form action={clientAction} className="space-y-5">
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm" role="alert">
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Username
                            </label>
                            <div className="mt-1.5">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    autoFocus
                                    required
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter your username"
                                    className="block w-full px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700/80 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Password
                            </label>
                            <div className="mt-1.5">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter your password"
                                    className="block w-full px-3 py-2.5 bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-300 dark:border-neutral-700/80 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-colors"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <SubmitButton />
                        </div>
                    </form>

                    <div className="pt-4 border-t border-neutral-200 dark:border-white/10 text-center text-sm text-neutral-600 dark:text-neutral-400">
                        New user?{' '}
                        <Link href="/onboard" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-4 transition-colors">
                            Set up your account / Onboard here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
