import { NextRequest, NextResponse } from 'next/server';
import { searchCategoryVideos } from '../../../lib/youtube';
import { getStoredInterests } from '../../../lib/storage';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q') || '';
        const categoryId = searchParams.get('categoryId');
        const channelId = searchParams.get('channelId');

        if (!query.trim()) {
            return NextResponse.json({ videos: [], hasMore: false });
        }

        const interests = await getStoredInterests();
        let targetChannels = interests.channels;

        if (channelId) {
            targetChannels = interests.channels.filter(c => c.id === channelId);
            if (targetChannels.length === 0) {
                // Channel ID provided but not in user's saved list - create dummy channel object for API call
                targetChannels = [{ id: channelId, title: 'Channel' }];
            }
        } else if (categoryId && categoryId !== 'all') {
            const category = interests.categories.find(c => c.id === categoryId);
            if (category) {
                targetChannels = interests.channels.filter(c => category.channelIds.includes(c.id));
            }
        }

        if (targetChannels.length === 0) {
            return NextResponse.json({ videos: [], hasMore: false });
        }

        const result = await searchCategoryVideos(targetChannels, query);

        return NextResponse.json({
            videos: result.videos,
            hasMore: false,
        });
    } catch (error) {
        console.error('Error searching videos in route:', error);
        return NextResponse.json(
            { error: 'Failed to search videos' },
            { status: 500 }
        );
    }
}
