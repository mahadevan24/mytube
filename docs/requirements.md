# Requirements Specification  
**Personal YouTube Dashboard**  
A private, personalized YouTube video feed showing **only** content from user-selected channels and topics.

## 1. Core Objective
Build a Next.js web application that acts as a personal YouTube dashboard.  
The app must display **exclusively** videos from channels and topics the user has explicitly chosen — no recommended videos, no trending content, no YouTube suggestions.

## 2. Primary User Stories

### 2.1 Manage Interests
- As a user, I can add YouTube channels by channel ID, username, or channel name/search.
- As a user, I can add topics (search queries) such as "artificial intelligence", "woodworking", "jazz piano".
- As a user, I can view a list of my currently selected channels and topics.
- As a user, I can remove any channel or topic from my list.
- My selections must persist across browser sessions (using localStorage or optionally a backend if authentication is added later).

### 2.2 View Personalized Feed
- As a user, when I open the homepage, the app automatically fetches and displays the latest videos **only** from my selected channels and topics.
- The feed combines videos from all selected channels (uploads) and topics (search results) in reverse chronological order (newest first).
- Each video card shows:
  - Thumbnail
  - Title
  - Channel name
  - Published date/time (relative, e.g., "3 hours ago")
  - Duration (if available)
  - View count (optional)
- Clicking a video card opens the video in an embedded YouTube player or redirects to youtube.com (configurable).

### 2.3 Refresh and Update
- As a user, I can manually refresh the feed to load the latest videos.
- The app should cache results for a reasonable time (e.g., 15–30 minutes) to respect YouTube API quotas, but always allow manual refresh.

## 3. Additional Use Cases & Features

### 3.1 Search and Add Interface
- Dedicated page/section for searching and adding new channels or topics.
- Channel search: use `channels.list` or `search.list` with `type=channel`.
- Topic addition: simple text input (treated as search query using `search.list` with `type=video`).

### 3.2 Feed Customization
- Option to limit number of videos per channel/topic (e.g., latest 5–10).
- Toggle between "All videos" and "Unwatched only" (if watch history is implemented later).

### 3.3 Responsive Design
- Fully responsive layout:
  - Desktop: sidebar with interests list + main grid feed
  - Mobile: collapsible sidebar or bottom sheet for interests

### 3.4 Error Handling & Loading States
- Graceful handling of API errors (invalid key, quota exceeded, network issues).
- Clear loading skeletons while fetching data.
- Informative messages if no interests are selected yet (e.g., "Add some channels or topics to get started!").

### 3.5 Performance & Quota Optimization
- Use server-side fetching (Next.js Server Components or API routes) to hide API key.
- Batch API calls efficiently (e.g., one call per channel for uploads, one or few for topics).
- Paginate feed if needed (infinite scroll or "Load more").

### 3.6 Future-Proof Extensions (Phase 2 – optional)
- User authentication (NextAuth.js + Google) to sync interests across devices.
- Mark videos as watched.
- Filter by upload date (today, this week).
- Playlist support.
- Notifications for new videos (if deployed with backend).

## 4. Non-Requirements (Explicitly Excluded)
- No YouTube recommendations, trending, or related videos.
- No video uploads or channel management.
- No comments, likes, or other YouTube interactions.

## 5. Technical Constraints
- Use YouTube Data API v3.
- API key stored in `.env.local` → accessed only server-side.
- All data fetching must be server-side (Server Components or API routes).
- Use TypeScript.
- Styling: Tailwind CSS.
- State management: React Server Components + localStorage for persistence.

## 6. Acceptance Criteria
- User can add/remove channels and topics.
- Interests persist after page reload.
- Homepage loads and shows only videos from selected interests.
- No external/recommended videos appear.
- App is responsive and handles loading/error states well.

---

This document serves as the single source of truth for requirements. Reference it in agent prompts to keep development aligned.