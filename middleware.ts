import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getEdgeJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: Variabel lingkungan JWT_SECRET wajib dikonfigurasi di lingkungan produksi.');
    }
    return 'dlh-samarinda-dev-secret-local-only';
  }
  return secret;
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyJwtEdge(token: string): Promise<{ id: string; role: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const secret = getEdgeJwtSecret();

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToUint8Array(signatureB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature as unknown as BufferSource,
      data as unknown as BufferSource
    );
    if (!isValid) return null;

    const payloadBytes = base64UrlToUint8Array(payloadB64);
    const payloadJson = new TextDecoder().decode(payloadBytes as unknown as BufferSource);
    const payload = JSON.parse(payloadJson);

    // Periksa masa berlaku token
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    if (!payload.id || !payload.role) return null;
    return { id: payload.id, role: payload.role };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Lindungi rute API admin (/api/admin/*) — kembalikan respons JSON 401/403
  if (pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('session_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Akses ditolak. Autentikasi admin diperlukan.' },
        { status: 401 }
      );
    }
    const user = await verifyJwtEdge(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Akses terlarang. Diperlukan hak akses administrator.' },
        { status: 403 }
      );
    }
  }

  // 2. Lindungi seluruh halaman UI admin (/admin/*), kecuali form login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('session_token')?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const user = await verifyJwtEdge(token);
    if (!user || user.role !== 'admin') {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
