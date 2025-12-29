import { supabase } from './supabase';
import { Channel, UserInterests, Category } from './types';

const UNCATEGORIZED_ID = 'uncategorized';

// Helper to read data from Supabase
async function readData(): Promise<UserInterests> {
    try {
        const { data, error } = await supabase
            .from('user_data')
            .select('content')
            .limit(1)
            .single();

        if (error) {
            console.error('Supabase read error:', error);
            throw error;
        }

        if (!data) {
            // Default if no data found
            return {
                channels: [],
                categories: [{ id: UNCATEGORIZED_ID, name: 'Channels', channelIds: [] }]
            };
        }

        return data.content as UserInterests;
    } catch (error) {
        console.error('Error reading data:', error);
        // Return default structure on error to prevent app crash
        return {
            channels: [],
            categories: [{ id: UNCATEGORIZED_ID, name: 'Channels', channelIds: [] }]
        };
    }
}

async function writeData(data: UserInterests): Promise<void> {
    try {
        // Check if a row exists
        const { data: rows, error: readError } = await supabase
            .from('user_data')
            .select('id')
            .limit(1);

        if (readError) throw readError;

        if (rows && rows.length > 0) {
            // Update existing row
            const { error } = await supabase
                .from('user_data')
                .update({ content: data })
                .eq('id', rows[0].id);
            if (error) throw error;
        } else {
            // Insert new row
            const { error } = await supabase
                .from('user_data')
                .insert({ content: data });
            if (error) throw error;
        }
    } catch (error) {
        console.error('Error writing data to Supabase:', error);
        throw error;
    }
}

export const getStoredInterests = async (): Promise<UserInterests> => {
    return await readData();
};

export const addChannel = async (channel: Channel, categoryId: string = UNCATEGORIZED_ID) => {
    const interests = await readData();
    let dirty = false;

    // 1. Ensure channel is in the main registry
    if (!interests.channels.find(c => c.id === channel.id)) {
        interests.channels.push(channel);
        dirty = true;
    }

    // 2. Check if it's assigned to any category
    if (!interests.categories) interests.categories = [];
    const isAssigned = interests.categories.some(cat => cat.channelIds.includes(channel.id));

    // 3. If not assigned (orphaned or new), add to target category
    if (!isAssigned) {
        let category = interests.categories.find(c => c.id === categoryId);

        // Use default if not found
        if (!category) {
            category = interests.categories.find(c => c.id === UNCATEGORIZED_ID);
            // Create default if completely missing
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
        await writeData(interests);
    }
};

export const removeChannel = async (channelId: string) => {
    const interests = await readData();

    // Remove from main list
    interests.channels = interests.channels.filter(c => c.id !== channelId);

    // Remove from all categories
    if (interests.categories) {
        interests.categories.forEach(cat => {
            cat.channelIds = cat.channelIds.filter(id => id !== channelId);
        });
    }

    await writeData(interests);
};

export const addCategory = async (name: string) => {
    const interests = await readData();
    const newCategory: Category = {
        id: Math.random().toString(36).substring(2, 9), // TODO: Use UUID?
        name,
        channelIds: []
    };
    if (!interests.categories) interests.categories = [];
    interests.categories.push(newCategory);
    await writeData(interests);
};

export const removeCategory = async (categoryId: string) => {
    if (categoryId === UNCATEGORIZED_ID) return;

    const interests = await readData();
    const categoryToRemove = interests.categories.find(c => c.id === categoryId);

    if (categoryToRemove) {
        // Find default category to move items to
        let defaultCat = interests.categories.find(c => c.id === UNCATEGORIZED_ID);
        if (!defaultCat) {
            const newDefault = { id: UNCATEGORIZED_ID, name: 'Channels', channelIds: [] };
            interests.categories.unshift(newDefault);
            defaultCat = newDefault;
        }

        // Move channels
        categoryToRemove.channelIds.forEach(id => {
            if (!defaultCat!.channelIds.includes(id)) {
                defaultCat!.channelIds.push(id);
            }
        });
    }

    interests.categories = interests.categories.filter(c => c.id !== categoryId);
    await writeData(interests);
};

export const renameCategory = async (categoryId: string, newName: string) => {
    const interests = await readData();
    const category = interests.categories.find(c => c.id === categoryId);
    if (category) {
        category.name = newName;
        await writeData(interests);
    }
};

export const updateCategoriesState = async (newCategories: Category[]) => {
    // We only update the categories array structure (order/content), 
    // but we must preserve the main channel list integrity.
    const interests = await readData();
    interests.categories = newCategories;
    await writeData(interests);
};
