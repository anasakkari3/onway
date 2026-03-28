import { NextResponse, type NextRequest } from 'next/server';

/** Pass-through middleware; auth is checked in layout/pages via getCurrentUser(). */
export async function authMiddleware(request: NextRequest) {
  return NextResponse.next({ request });
}
