'use server';

import { searchChannels, extractYouTubeVideoId, getSingleVideoDetails } from './lib/youtube';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as db from './lib/storage';
import { Channel, Category, Video, WatchlistVideo, WatchlistStatus } from './lib/types';
import { revalidatePath } from 'next/cache';


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
    revalidatePath('/'); // This might be heavy for dnd, but ensures sync
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


// --------------------------------

export async function login(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const validUsername = process.env.AUTH_USERNAME;
    const validPassword = process.env.AUTH_PASSWORD;

    if (!validUsername || !validPassword) {
        console.error('AUTH_USERNAME or AUTH_PASSWORD not set in environment variables');
        return { error: 'Server configuration error' };
    }

    if (username === validUsername && password === validPassword) {
        // Set cookie valid for 7 days
        (await cookies()).set('auth_session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
        redirect('/');
    } else {
        return { error: 'Invalid username or password' };
    }
}
