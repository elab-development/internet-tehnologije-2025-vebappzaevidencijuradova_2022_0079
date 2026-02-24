import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // 1. XSS ZAŠTITA (CSP)
    // 'self' dozvoljava resurse samo sa tvog domena
    // 'unsafe-inline' je često neophodan za Next.js stilove, ali CSP i dalje blokira tuđe skripte
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:;"
    );

    // 2. CORS ZAŠTITA
    // Ovim dozvoljavaš svom frontendu da priča sa API-jem
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com https://apis.google.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com; " +
        "connect-src 'self' https://*.rapidapi.com https://www.gstatic.com https://www.google.com; " +
        "img-src 'self' data: https://www.gstatic.com https://www.google.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "frame-src 'self' https://www.google.com;"
    );
    // 3. DODATNA ZAŠTITA (Protiv clickjacking-a)
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;
}

// Veoma bitno: Matcher određuje gde se middleware primenjuje
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};