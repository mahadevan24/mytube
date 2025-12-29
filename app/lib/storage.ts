import fs from 'fs/promises';
import path from 'path';
import { Channel, UserInterests, Category } from './types';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'interests.json');
const UNCATEGORIZED_ID = 'uncategorized';

// Helper to ensure data file exists and read it
async function readData(): Promise<UserInterests> {
    try {
        const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or error, return default structure
        const defaultData: UserInterests = {
            channels: [],
            categories: [{ id: UNCATEGORIZED_ID, name: 'Channels', channelIds: [] }]
        };
        // Try to write the default if it was missing
        try {
            await writeData(defaultData);
        } catch (e) { /* ignore write error during read */ }
        return defaultData;
    }
}

async function writeData(data: UserInterests): Promise<void> {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
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
        id: Math.random().toString(36).substring(2, 9),
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
    // but we must preserve the main channel list integrity from the file to be safe, 
    // although simpler is just to update the categories part.
    const interests = await readData();
    interests.categories = newCategories;
    await writeData(interests);
};

// No-op for saveInterests as we use fs now, but kept for compatibility if needed by other files temporarily? 
// No, I should remove it as it was for cookies.
// But InterestManager might still be importing it? 
// I removed saveInterests import from InterestManager in Step 54!
// So I don't need to export it.
