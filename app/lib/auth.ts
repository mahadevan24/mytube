import { pbkdf2Sync, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { supabase } from './supabase';

export function hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combined: string): boolean {
    if (!combined || !combined.includes(':')) return false;
    const [salt, originalHash] = combined.split(':');
    const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === originalHash;
}

export interface UserSession {
    userId: string;
    username: string;
    youtubeApiKey?: string | null;
}

export async function getCurrentUser(): Promise<UserSession | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('auth_session');
        if (!sessionCookie || !sessionCookie.value) {
            return null;
        }

        const userId = sessionCookie.value;

        // Fetch user info from Supabase
        const { data, error } = await supabase
            .from('users')
            .select('id, username, youtube_api_key')
            .eq('id', userId)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            userId: data.id,
            username: data.username,
            youtubeApiKey: data.youtube_api_key || null,
        };
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}
