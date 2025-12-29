'use client';

import { login } from '../actions';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-400/90 via-yellow-400/90 to-lime-400/90 hover:from-green-500/90 hover:via-yellow-500/90 hover:to-lime-500/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400/50 transition-all ${pending ? 'opacity-50 cursor-not-allowed' : ''
                }`}
        >
            {pending ? 'Signing in...' : 'Sign in'}
        </button>
    );
}

export default function LoginPage() {
    const [errorMessage, setErrorMessage] = useState<string>('');

    async function clientAction(formData: FormData) {
        const result = await login(formData);
        if (result?.error) {
            setErrorMessage(result.error);
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">
                    MyTube Dashboard
                </h2>
                <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    Private Access Only
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-neutral-900 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-neutral-200 dark:border-white/10">
                    <form action={clientAction} className="space-y-6">
                        {errorMessage && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded relative text-sm" role="alert">
                                <span className="block sm:inline">{errorMessage}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Username
                            </label>
                            <div className="mt-1">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <SubmitButton />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
