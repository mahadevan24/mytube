'use server';

import { searchChannels } from './lib/youtube';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as db from './lib/storage';
import { Channel, Category } from './lib/types';
import { revalidatePath } from 'next/cache';

export async function searchChannelsAction(query: string) {
    return await searchChannels(query);
}

// --- Data Persistence Actions ---

export async function getInterestsAction() {
    return await db.getStoredInterests();
}

export async function addChannelAction(channel: Channel) {
    await db.addChannel(channel);
    revalidatePath('/');
}

export async function removeChannelAction(id: string) {
    await db.removeChannel(id);
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
