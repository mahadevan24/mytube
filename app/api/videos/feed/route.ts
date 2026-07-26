import { NextRequest, NextResponse } from 'next/server';
import { getPersonalizedFeed } from '../../../lib/youtube';
import { getStoredInterests } from '../../../lib/storage';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const maxResults = parseInt(searchParams.get('maxResults') || '20', 10);
        const categoryId = searchParams.get('categoryId');

        // Parse channel tokens from query params if provided
        const channelTokensParam = searchParams.get('channelTokens');
        let channelTokens: Record<string, string | undefined> | undefined;
        if (channelTokensParam) {
            try {
                channelTokens = JSON.parse(channelTokensParam);
            } catch (e) {
                // Invalid JSON, ignore
            }
        }

        const interests = await getStoredInterests();
        let targetChannels = interests.channels;

        if (categoryId) {
            const category = interests.categories.find(c => c.id === categoryId);
            if (category) {
                targetChannels = interests.channels.filter(c => category.channelIds.includes(c.id));
            }
        }
        
        if (targetChannels.length === 0) {
            return NextResponse.json({
                videos: [],
                channelTokens: {},
                hasMore: false,
            });
        }

        const result = await getPersonalizedFeed(
            targetChannels,
            maxResults,
            channelTokens
        );

        return NextResponse.json({
            videos: result.videos,
            channelTokens: result.channelTokens,
            hasMore: result.hasMore,
        });
    } catch (error) {
        console.error('Error fetching personalized feed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch videos' },
            { status: 500 }
        );
    }
}

