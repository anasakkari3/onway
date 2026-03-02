import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ensureUserProfile } from '@/app/(auth)/login/sync-user';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  try {
    await ensureUserProfile();
  } catch {
    // Still redirect; profile can be created later
  }

  const origin = new URL(request.url).origin;
  const redirectUrl = next.startsWith('/') ? `${origin}${next}` : `${origin}/`;
  return NextResponse.redirect(redirectUrl);
}
