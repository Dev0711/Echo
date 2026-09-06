import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Minimal middleware — auth is handled client-side via AuthGuard
// since JWTs live in localStorage which is not accessible server-side.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],  // No routes matched — effectively disabled
};
