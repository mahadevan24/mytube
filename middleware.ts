import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Public paths that don't require authentication
    const publicPaths = ['/login', '/favicon.ico']

    // Check if the current path is public or a static asset
    if (publicPaths.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
        return NextResponse.next()
    }

    // Check for the auth cookie
    const authCookie = request.cookies.get('auth_session')

    if (!authCookie) {
        // Redirect to login page if no auth cookie is present
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
