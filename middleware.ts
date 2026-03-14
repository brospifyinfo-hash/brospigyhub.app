import { type NextRequest, NextResponse } from 'next/server';

// Keine Auth-Redirects in der Middleware – Supabase-Cookies haben projektspezifische Namen,
// die hier nicht zuverlässig geprüft werden können. Redirects erledigen die Server-Components
// (Login → Dashboard bei Session, Dashboard-Layout → Login ohne Session).
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};
