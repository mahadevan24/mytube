---
trigger: always_on
---

# App Guidelines  
**.agent/rules/app-guidelines.md**

These rules are persistent instructions that all agents must follow when working on this Personal YouTube Dashboard project. Always adhere to these guidelines unless explicitly overridden in a specific prompt.

## Project Overview
- This is a **personal** YouTube dashboard showing **only** videos from user-selected channels and topics.
- No recommendations, trending, or unrelated content must ever appear.

## Architecture & Next.js Best Practices
- Use the **App Router** (app/ directory).
- Prefer **React Server Components** for data fetching and rendering the feed.
- Use **Server Actions** for mutations (adding/removing channels/topics) if needed.
- Client-side interactivity only where necessary (e.g., localStorage sync, modals, refresh button).
- All YouTube API calls **must be server-side** (never expose the API key to the client).

## Data Fetching & YouTube API
- Use **YouTube Data API v3** via the official `@googleapis/youtube` package.
- Store the API key in `.env.local` as `YOUTUBE_API_KEY`.
- Primary endpoints:
  - `search.list` (for topics/search queries, type: 'video')
  - `channels.list` + `playlistItems.list` (for channel uploads via the channel's uploads playlist ID)
  - `videos.list` (to get additional details like duration if needed)
- Batch calls efficiently to stay within quota limits.
- Cache responses in memory or via `unstable_cache` / `revalidate` where appropriate (e.g., 15–30 minutes).
- Sort combined results by publishedAt descending (newest first).

## State & Persistence
- User-selected channels and topics are stored in **localStorage** (key: e.g., `my-youtube-interests`).
- Structure:
  ```ts
  {
    channels: Array<{ id: string; title: string; thumbnail?: string }>;
    topics: Array<{ query: string }>;
  }
- Sync localStorage on mount and after any add/remove operation.

## Design and Style Guidelines
- UI Framework: Use Tailwind CSS for styling (install if needed).
- Layout: Responsive grid-based design (e.g., sidebar for channels/topics selection, main feed for videos).
- Theme: Modern, dark-mode compatible (use Tailwind's dark class). Colors: Primary #FF0000 (YouTube red), neutral grays.
- Components: Reuse modular components (e.g., VideoCard, ChannelSelector).
- Accessibility: Ensure ARIA labels, keyboard navigation, and alt text for images.

## Code Standards
- Language: TypeScript for all files.
- Testing: Add unit tests with Jest for API integrations.
- Best Practices: Follow ESLint/Prettier configs; commit changes with meaningful messages.