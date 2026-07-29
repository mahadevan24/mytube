import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import { Channel, UserInterests, Category, WatchlistVideo, WatchlistStatus, MusicVideo } from './types';

const UNCATEGORIZED_ID = 'uncategorized';

export function getDefaultInterests(): UserInterests {
    return {
        channels: [],
        categories: [{ id: UNCATEGORIZED_ID, name: 'Channels', channelIds: [] }],
        watchlist: [],
        musicList: []
    };
}

async function getTargetUserId(explicitUserId?: string): Promise<string | null> {
    if (explicitUserId) return explicitUserId;
    const user = await getCurrentUser();
    return user ? user.userId : null;
}

// Helper to read data from Supabase for a specific user
async function readData(explicitUserId?: string): Promise<UserInterests> {
    const userId = await getTargetUserId(explicitUserId);
    if (!userId) {
        return getDefaultInterests();
    }

    try {
        // 1. Try fetching row for this specific user
        let { data, error } = await supabase
            .from('user_data')
            .select('id, content, user_id')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Supabase read error:', error);
            return getDefaultInterests();
        }

        // 2. Fallback: if no user-specific row found, check for legacy unassigned row (where user_id is null)
        if (!data) {
            const { data: legacyData } = await supabase
                .from('user_data')
                .select('id, content, user_id')
                .is('user_id', null)
                .limit(1)
                .maybeSingle();

            if (legacyData) {
                // Assign legacy row to this user so their existing channels/watchlist are preserved
                await supabase
                    .from('user_data')
                    .update({ user_id: userId })
                    .eq('id', legacyData.id);
                data = legacyData;
            }
        }

        if (!data || !data.content) {
            return getDefaultInterests();
        }

        const res = data.content as UserInterests;
        if (!res.watchlist) res.watchlist = [];
        if (!res.musicList) res.musicList = [];
        if (!res.categories) res.categories = [{ id: UNCATEGORIZED_ID, name: 'Channels', channelIds: [] }];
        if (!res.channels) res.channels = [];
        return res;
    } catch (error) {
        console.error('Error reading data:', error);
        return getDefaultInterests();
    }
}

async function writeData(data: UserInterests, explicitUserId?: string): Promise<void> {
    const userId = await getTargetUserId(explicitUserId);
    if (!userId) {
        console.error('Cannot write data: No user logged in');
        return;
    }

    try {
        let { data: existingRow, error: readError } = await supabase
            .from('user_data')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (readError) throw readError;

        if (!existingRow) {
            // Check for legacy unassigned row
            const { data: legacyRow } = await supabase
                .from('user_data')
                .select('id')
                .is('user_id', null)
                .limit(1)
                .maybeSingle();

            if (legacyRow) {
                existingRow = legacyRow;
            }
        }

        if (existingRow) {
            // Update existing row & assign user_id
            const { error } = await supabase
                .from('user_data')
                .update({ content: data, user_id: userId })
                .eq('id', existingRow.id);
            if (error) throw error;
        } else {
            // Insert new row
            const { error } = await supabase
                .from('user_data')
                .insert({ user_id: userId, content: data });
            if (error) throw error;
        }
    } catch (error) {
        console.error('Error writing data to Supabase:', error);
        throw error;
    }
}

export const getStoredInterests = async (userId?: string): Promise<UserInterests> => {
    return await readData(userId);
};

export const addChannel = async (channel: Channel, categoryId: string = UNCATEGORIZED_ID, userId?: string) => {
    const interests = await readData(userId);
    let dirty = false;

    if (!interests.channels.find(c => c.id === channel.id)) {
        interests.channels.push(channel);
        dirty = true;
    }

    if (!interests.categories) interests.categories = [];
    const isAssigned = interests.categories.some(cat => cat.channelIds.includes(channel.id));

    if (!isAssigned) {
        let category = interests.categories.find(c => c.id === categoryId);

        if (!category) {
            category = interests.categories.find(c => c.id === UNCATEGORIZED_ID);
            if (!category) {
                category = { id: UNCATEGORIZED_ID, name: 'Channels', channelIds: [] };
                interests.categories.unshift(category);
                dirty = true;
            }
        }

        if (category && !category.channelIds.includes(channel.id)) {
            category.channelIds.push(channel.id);
            dirty = true;
        }
    }

    if (dirty) {
        await writeData(interests, userId);
    }
};

export const removeChannel = async (channelId: string, userId?: string) => {
    const interests = await readData(userId);

    interests.channels = interests.channels.filter(c => c.id !== channelId);

    if (interests.categories) {
        interests.categories.forEach(cat => {
            cat.channelIds = cat.channelIds.filter(id => id !== channelId);
        });
    }

    await writeData(interests, userId);
};

export const addCategory = async (name: string, userId?: string) => {
    const interests = await readData(userId);
    const newCategory: Category = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        channelIds: []
    };
    if (!interests.categories) interests.categories = [];
    interests.categories.push(newCategory);
    await writeData(interests, userId);
};

export const removeCategory = async (categoryId: string, userId?: string) => {
    if (categoryId === UNCATEGORIZED_ID) return;

    const interests = await readData(userId);
    const categoryToRemove = interests.categories.find(c => c.id === categoryId);

    if (categoryToRemove) {
        let defaultCat = interests.categories.find(c => c.id === UNCATEGORIZED_ID);
        if (!defaultCat) {
            const newDefault = { id: UNCATEGORIZED_ID, name: 'Channels', channelIds: [] };
            interests.categories.unshift(newDefault);
            defaultCat = newDefault;
        }

        categoryToRemove.channelIds.forEach(id => {
            if (!defaultCat!.channelIds.includes(id)) {
                defaultCat!.channelIds.push(id);
            }
        });
    }

    interests.categories = interests.categories.filter(c => c.id !== categoryId);
    await writeData(interests, userId);
};

export const renameCategory = async (categoryId: string, newName: string, userId?: string) => {
    const interests = await readData(userId);
    const category = interests.categories.find(c => c.id === categoryId);
    if (category) {
        category.name = newName;
        await writeData(interests, userId);
    }
};

export const updateCategoriesState = async (newCategories: Category[], userId?: string) => {
    const interests = await readData(userId);
    interests.categories = newCategories;
    await writeData(interests, userId);
};

export const moveChannelToCategory = async (channelId: string, targetCategoryId: string, userId?: string) => {
    const interests = await readData(userId);
    if (!interests.categories) interests.categories = [];

    let targetCat = interests.categories.find(c => c.id === targetCategoryId);
    if (!targetCat && targetCategoryId === UNCATEGORIZED_ID) {
        targetCat = { id: UNCATEGORIZED_ID, name: 'Channels', channelIds: [] };
        interests.categories.unshift(targetCat);
    }
    if (!targetCat) return;

    interests.categories.forEach(cat => {
        cat.channelIds = cat.channelIds.filter(id => id !== channelId);
    });

    if (!targetCat.channelIds.includes(channelId)) {
        targetCat.channelIds.push(channelId);
    }

    await writeData(interests, userId);
};

// --- Watchlist Storage Functions ---

export const getWatchlistVideos = async (userId?: string): Promise<WatchlistVideo[]> => {
    const interests = await readData(userId);
    return interests.watchlist || [];
};

export const addWatchlistVideo = async (video: WatchlistVideo, userId?: string): Promise<void> => {
    const interests = await readData(userId);
    if (!interests.watchlist) interests.watchlist = [];

    const existingIndex = interests.watchlist.findIndex(v => v.id === video.id);
    if (existingIndex !== -1) {
        interests.watchlist.splice(existingIndex, 1);
    }

    interests.watchlist.unshift(video);
    await writeData(interests, userId);
};

export const removeWatchlistVideo = async (videoId: string, userId?: string): Promise<void> => {
    const interests = await readData(userId);
    if (!interests.watchlist) return;

    interests.watchlist = interests.watchlist.filter(v => v.id !== videoId);
    await writeData(interests, userId);
};

export const updateWatchlistStatus = async (videoId: string, status: WatchlistStatus, userId?: string): Promise<void> => {
    const interests = await readData(userId);
    if (!interests.watchlist) return;

    const item = interests.watchlist.find(v => v.id === videoId);
    if (item) {
        item.status = status;
        await writeData(interests, userId);
    }
};

// --- Music List Storage Functions ---

export const getMusicListVideos = async (userId?: string): Promise<MusicVideo[]> => {
    const interests = await readData(userId);
    return interests.musicList || [];
};

export const addMusicVideo = async (video: MusicVideo, userId?: string): Promise<void> => {
    const interests = await readData(userId);
    if (!interests.musicList) interests.musicList = [];

    const existingIndex = interests.musicList.findIndex(v => v.id === video.id);
    if (existingIndex !== -1) {
        interests.musicList.splice(existingIndex, 1);
    }

    interests.musicList.unshift(video);
    await writeData(interests, userId);
};

export const removeMusicVideo = async (videoId: string, userId?: string): Promise<void> => {
    const interests = await readData(userId);
    if (!interests.musicList) return;

    interests.musicList = interests.musicList.filter(v => v.id !== videoId);
    await writeData(interests, userId);
};
