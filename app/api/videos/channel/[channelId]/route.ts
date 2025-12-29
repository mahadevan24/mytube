import { NextRequest, NextResponse } from 'next/server';
import { getChannelVideos } from '../../../../lib/youtube';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ channelId: string }> }
) {
    let channelId: string | undefined;
    try {
        const resolvedParams = await params;
        channelId = resolvedParams.channelId;
        const searchParams = request.nextUrl.searchParams;
        const pageToken = searchParams.get('pageToken') || undefined;
        const maxResults = parseInt(searchParams.get('maxResults') || '20', 10);

        const result = await getChannelVideos(channelId, maxResults, pageToken);

        return NextResponse.json({
            videos: result.videos,
            nextPageToken: result.nextPageToken,
            hasMore: result.hasMore,
        });
    } catch (error) {
        console.error(`Error fetching channel videos for ${channelId || 'unknown'}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch videos' },
            { status: 500 }
        );
    }
}

