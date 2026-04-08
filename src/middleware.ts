import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // FIX: Skip session update for auth callback route.
  // Previously the middleware was intercepting the OAuth callback before
  // Supabase could exchange the code for a session, causing a redirect loop
  // that forced users to sign in twice.
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/auth/callback')) {
    return
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
