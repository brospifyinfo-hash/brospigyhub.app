import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  await clearAdminSession();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/login', url.origin));
}
