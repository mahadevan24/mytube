# MyTube Project Guidelines

## Overview
This is a Next.js 16 app with React 19, TypeScript, Tailwind CSS, and YouTube API integration. Prioritize server-first architecture, performance optimization, and type safety in all code.

## Code Style & Type Safety

### TypeScript Requirements
- **Always use strict types**: Avoid `any`; create narrow interfaces instead (see `lib/types.ts`)
- **Use type inference wisely**: Let TypeScript infer simple types but be explicit for API responses and complex objects
- **Consistent type locations**: Data types in `lib/types.ts`, API schemas in route files
- Example:
  ```typescript
  // ✅ Good: clear interface with specific fields
  interface VideoCard {
    id: string;
    title: string;
    thumbnail: string;
    channelId: string;
  }
  
  // ❌ Avoid: overly generic or loose types
  const video: any = response.data;
  ```

### Component Structure
- **Use `'use client'` sparingly**: Only on components needing browser APIs (state, events, hooks)
- **Prefer Server Components**: Use server components for data fetching, layout, and static content
- **Component organization**: one responsibility per file, colocate related utilities
- **File naming**: PascalCase for components, lowercase for utilities

## Performance Optimization

### Image & Asset Loading
- **Always use Next.js Image component** for videos/thumbnails: `import Image from 'next/image'`
- **Lazy load thumbnails**: Set `loading="lazy"` on images below the fold
- **Optimize metadata**: Include `alt`, `width`, `height` for proper sizing and CLS prevention
- Example:
  ```typescript
  <Image
    src={thumbnail}
    alt={title}
    width={320}
    height={180}
    loading="lazy"
    className="rounded-lg"
  />
  ```

### Component Memoization
- **Memoize expensive components**: Use `React.memo()` for components that receive inline object props or render in lists
- **Memoize callbacks**: Use `useCallback()` for handlers passed to memoized child components
- **Apply to VideoCard and similar** components that render frequently with stable props
- Example:
  ```typescript
  export const VideoCard = React.memo(({ video, onPlay }: VideoCardProps) => {
    return (/* ... */);
  }, (prev, next) => 
    prev.video.id === next.video.id && prev.onPlay === next.onPlay
  );
  ```

### Data Fetching & Pagination
- **Pagination over large datasets**: Use `pageToken` pagination (already implemented) to reduce payload
- **Fetch on-demand in infinite scrolls**: Load next page only when user scrolls near bottom
- **Cache API responses**: Use `revalidateTag()` and `revalidatePath()` in Server Actions for efficient re-fetching
- **Parallel requests**: Batch channel/video requests where possible to minimize round trips

### Code Splitting & Dynamic Imports
- **Lazy load non-critical components**: Use `next/dynamic` for modals, heavy features
- **Example with VideoModal**:
  ```typescript
  const VideoModal = dynamic(() => import('./VideoModal'), { 
    loading: () => <Loader /> 
  });
  ```

## Architecture & Structure

### File Organization
```
app/
  ├── api/              # API routes (server-only)
  ├── components/       # Reusable client/server components
  ├── lib/              # Utilities, types, services
  │   ├── types.ts
  │   ├── youtube.ts    # YouTube API client
  │   ├── supabase.ts   # Supabase client
  │   └── storage.ts    # Local storage helpers
  ├── login/            # Auth-specific pages
  └── (routes)/         # Page routes
```

### API Route Design
- **Minimal API routes**: Compute-heavy logic should be in `lib/` utilities, not route handlers
- **Consistent error responses**: Return `{ error: string, code: 'SPECIFIC_ERROR' }` structure
- **Validate input**: Check required params and validate types before processing
- **Use Server Actions for mutations**: Prefer Server Actions over POST routes for form submissions
- Example route:
  ```typescript
  // app/api/videos/channel/[channelId]/route.ts
  export async function GET(
    request: Request,
    { params }: { params: { channelId: string } }
  ) {
    try {
      const { pageToken } = Object.fromEntries(new URL(request.url).searchParams);
      const videos = await fetchChannelVideos(params.channelId, pageToken);
      return Response.json(videos);
    } catch (error) {
      return Response.json(
        { error: 'Failed to fetch videos' },
        { status: 500 }
      );
    }
  }
  ```

### State Management
- **Minimize client-side state**: Use URL params for filters, pagination (already done with `pageToken`)
- **Use `useState` for UI state**: Modal open/close, form inputs, UI toggles
- **Never store sensitive data** (tokens, API keys) in component state or localStorage (use server-side storage)

## Conventions

### Naming
- **API routes**: Plural nouns (`/api/videos`, `/api/channels`)
- **Server Actions**: Verb + noun (`fetchVideos`, `updateInterests`, `deleteChannel`)
- **Event handlers**: Prefix with `on` (`onPlay`, `onClick`, `onScroll`)
- **Boolean variables**: Start with `is` or `has` (`isLoading`, `hasMore`, `isOpen`)

### Error Handling
- **Always wrap async operations** in try/catch blocks
- **Provide meaningful error messages** to users (avoid exposing internal error details)
- **Log errors for debugging**: Use `console.error()` in development, structured logging in production

### Comments & Documentation
- **Self-documenting code > comments**: Favor clear variable/function names over explaining intent
- **Comment "why", not "what"**: Explain non-obvious business logic or performance trade-offs
- **Document complex algorithms**: Ensure maintenance developers understand pagination logic or cache invalidation

## Specific Patterns

### Video Fetching Workflow
- Use `fetchChannelVideos()` or `fetchUserFeed()` from `lib/youtube.ts`
- Always pass `pageToken` for pagination; store tokens in component state
- Return typed `Video[]` arrays; map API response to `Video` interface
- Handle missing durations gracefully (some videos may not have duration metadata)

### Interest Management
- Store user interests in Supabase (channels + categories)
- Sync interests to localStorage for quick access
- Re-fetch interests on app load from Supabase to sync across tabs

### Theme Handling
- Theme switching is already set up; use `next-themes` + Tailwind
- Avoid hardcoding colors; use Tailwind classes (`dark:bg-slate-900`, etc.)
- Test both light and dark modes

## Testing & Validation

### Before committing:
- **Type check**: Ensure no TypeScript errors (`npm run build`)
- **Lint**: Run `npm run lint` and fix violations
- **Manual testing**: Test infinite scroll, pagination, theme toggle
- **Performance**: Use Lighthouse to check performance on production build
- **Error scenarios**: Test with missing images, slow network, invalid API responses

## Common Gotchas

1. **Hydration mismatches**: Keep server/client component trees in sync; use `suppressHydrationWarning` sparingly
2. **Image dimensions**: Only `next/image` without width/height causes layout shift; always specify dimensions
3. **API key exposure**: YouTube API keys in environment variables; never commit `.env.local`
4. **Pagination state loss**: When clearing filters, reset `pageToken` to avoid stale page tokens
5. **Unnecessary re-renders**: Check component memoization if sluggish infinite scroll; profile with React DevTools

## Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Web Vitals & Performance](https://web.dev/vitals/)
- Local docs: `docs/requirements.md` for feature requirements
