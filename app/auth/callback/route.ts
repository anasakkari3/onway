import { NextResponse } from 'next/server';

/** Legacy OAuth callback; with Firebase email/password auth we redirect to home. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get('next') ?? '/';
  const origin = new URL(request.url).origin;
  const redirectUrl = next.startsWith('/') ? `${origin}${next}` : `${origin}/`;
  return NextResponse.redirect(redirectUrl);
}
