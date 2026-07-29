'use server';

import { searchChannels, extractYouTubeVideoId, getSingleVideoDetails, searchMusicVideos, getRecommendedMusicVideos, fetchElonMuskVideos } from './lib/youtube';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as db from './lib/storage';
import { Channel, Category, Video, WatchlistVideo, WatchlistStatus, MusicVideo } from './lib/types';
import { revalidatePath } from 'next/cache';
import { supabase } from './lib/supabase';
import { hashPassword, verifyPassword } from './lib/auth';

export async function searchChannelsAction(query: string) {
    return await searchChannels(query);
}

// --- Data Persistence Actions ---

export async function getInterestsAction() {
    return await db.getStoredInterests();
}

export async function addChannelAction(channel: Channel, categoryId?: string) {
    await db.addChannel(channel, categoryId);
    revalidatePath('/');
}

export async function removeChannelAction(id: string) {
    await db.removeChannel(id);
    revalidatePath('/');
}

export async function moveChannelCategoryAction(channelId: string, targetCategoryId: string) {
    await db.moveChannelToCategory(channelId, targetCategoryId);
    revalidatePath('/');
}

export async function addCategoryAction(name: string) {
    await db.addCategory(name);
    revalidatePath('/');
}

export async function removeCategoryAction(categoryId: string) {
    await db.removeCategory(categoryId);
    revalidatePath('/');
}

export async function renameCategoryAction(categoryId: string, newName: string) {
    await db.renameCategory(categoryId, newName);
    revalidatePath('/');
}

export async function updateCategoriesStateAction(newCategories: Category[]) {
    await db.updateCategoriesState(newCategories);
    revalidatePath('/');
}

// --- Watchlist Actions ---

export async function getWatchlistAction() {
    return await db.getWatchlistVideos();
}

export async function addWatchlistVideoByUrlAction(inputUrl: string) {
    const videoId = extractYouTubeVideoId(inputUrl);
    if (!videoId) {
        return { error: 'Invalid YouTube link or Video ID. Please check the URL and try again.' };
    }

    const videoDetails = await getSingleVideoDetails(videoId);
    if (!videoDetails) {
        return { error: 'Could not fetch video details. Please make sure the video exists and is public.' };
    }

    const watchlistVideo: WatchlistVideo = {
        ...videoDetails,
        addedAt: new Date().toISOString(),
        status: 'unwatched',
    };

    await db.addWatchlistVideo(watchlistVideo);
    revalidatePath('/watchlist');
    revalidatePath('/');
    return { success: true, video: watchlistVideo };
}

export async function addVideoToWatchlistAction(video: Video) {
    const watchlistVideo: WatchlistVideo = {
        ...video,
        addedAt: new Date().toISOString(),
        status: 'unwatched',
    };
    await db.addWatchlistVideo(watchlistVideo);
    revalidatePath('/watchlist');
    revalidatePath('/');
    return { success: true };
}

export async function removeWatchlistVideoAction(videoId: string) {
    try {
        await db.removeWatchlistVideo(videoId);
        revalidatePath('/watchlist');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to remove watchlist video:', error);
        return { success: false, error: 'Failed to remove video' };
    }
}

export async function updateWatchlistStatusAction(videoId: string, status: WatchlistStatus) {
    await db.updateWatchlistStatus(videoId, status);
    revalidatePath('/watchlist');
    revalidatePath('/');
    return { success: true };
}

// --- Music List Actions ---

export async function getMusicListAction() {
    return await db.getMusicListVideos();
}

export async function addMusicVideoByUrlAction(inputUrl: string) {
    const videoId = extractYouTubeVideoId(inputUrl);
    if (!videoId) {
        return { error: 'Invalid YouTube link or Video ID. Please check the URL and try again.' };
    }

    const videoDetails = await getSingleVideoDetails(videoId);
    if (!videoDetails) {
        return { error: 'Could not fetch video details. Please make sure the video exists and is public.' };
    }

    const musicVideo: MusicVideo = {
        ...videoDetails,
        addedAt: new Date().toISOString(),
    };

    await db.addMusicVideo(musicVideo);
    revalidatePath('/music');
    revalidatePath('/');
    return { success: true, video: musicVideo };
}

export async function addVideoToMusicAction(video: Video) {
    const musicVideo: MusicVideo = {
        ...video,
        addedAt: new Date().toISOString(),
    };
    await db.addMusicVideo(musicVideo);
    revalidatePath('/music');
    revalidatePath('/');
    return { success: true };
}

export async function removeMusicVideoAction(videoId: string) {
    try {
        await db.removeMusicVideo(videoId);
        revalidatePath('/music');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to remove music video:', error);
        return { success: false, error: 'Failed to remove video' };
    }
}

export async function getMusicRecommendationsAction(query?: string) {
    if (query && query.trim()) {
        return await searchMusicVideos(query.trim(), 24);
    }
    const interests = await db.getStoredInterests();
    return await getRecommendedMusicVideos(interests.channels, interests.musicList);
}

// --- Elon Musk Tab Actions ---

export async function getElonMuskVideosAction(
    filter: 'all' | 'talks' | 'interviews' | 'podcasts' = 'all',
    searchQuery?: string
) {
    return await fetchElonMuskVideos(filter, searchQuery, 24);
}

// --- Authentication & User Onboarding Actions ---

export async function registerUser(formData: FormData) {
    const username = (formData.get('username') as string || '').trim().toLowerCase();
    const password = formData.get('password') as string || '';
    const confirmPassword = formData.get('confirmPassword') as string || '';
    const youtubeApiKey = (formData.get('youtubeApiKey') as string || '').trim();

    if (!username || !password) {
        return { error: 'Username and password are required.' };
    }

    if (username.length < 3) {
        return { error: 'Username must be at least 3 characters long.' };
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters long.' };
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match.' };
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    if (existingUser) {
        return { error: 'Username is already taken. Please choose another one.' };
    }

    const hashedPassword = hashPassword(password);

    // Insert user into `users` table
    const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
            username,
            password_hash: hashedPassword,
            youtube_api_key: youtubeApiKey || process.env.YOUTUBE_API_KEY || null,
        })
        .select('id')
        .single();

    if (insertError || !newUser) {
        console.error('Failed to register user in Supabase:', insertError);
        return { error: 'Registration failed due to a database error. Please try again.' };
    }

    // Check for legacy unassigned row in user_data
    const { data: legacyRow } = await supabase
        .from('user_data')
        .select('id')
        .is('user_id', null)
        .limit(1)
        .maybeSingle();

    if (legacyRow) {
        await supabase
            .from('user_data')
            .update({ user_id: newUser.id })
            .eq('id', legacyRow.id);
    } else {
        const defaultData = db.getDefaultInterests();
        await supabase.from('user_data').insert({
            user_id: newUser.id,
            content: defaultData,
        });
    }

    // Set auth_session cookie
    (await cookies()).set('auth_session', newUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });

    redirect('/');
}

export async function login(formData: FormData) {
    const username = (formData.get('username') as string || '').trim().toLowerCase();
    const password = formData.get('password') as string || '';

    if (!username || !password) {
        return { error: 'Please enter both username and password.' };
    }

    const envUsername = (process.env.AUTH_USERNAME || 'mahadevanax').trim().toLowerCase();
    const envPassword = process.env.AUTH_PASSWORD || 'mahadevanax';

    // Fetch user from Supabase
    let { data: user, error } = await supabase
        .from('users')
        .select('id, password_hash')
        .eq('username', username)
        .maybeSingle();

    // Auto-create/migrate primary account (mahadevanax or AUTH_USERNAME) if missing in database
    if (!user && (username === envUsername || username === 'mahadevanax') && (password === envPassword || password === 'mahadevanax')) {
        const hashedPassword = hashPassword(password);
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                username,
                password_hash: hashedPassword,
                youtube_api_key: process.env.YOUTUBE_API_KEY || null,
            })
            .select('id')
            .single();

        if (!insertError && newUser) {
            user = { id: newUser.id, password_hash: hashedPassword };
        }
    }

    if (error || !user) {
        return { error: 'Invalid username or password' };
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
        return { error: 'Invalid username or password' };
    }

    // Set auth cookie storing the user's ID
    (await cookies()).set('auth_session', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });

    redirect('/');
}

export async function logout() {
    (await cookies()).set('auth_session', '', {
        httpOnly: true,
        maxAge: 0,
        path: '/',
    });
    redirect('/login');
}
