import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function exchangeGoogleCode(code: string, redirectUri: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  return res.json();
}

async function exchangeMicrosoftCode(code: string, redirectUri: string) {
  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      scope: 'Files.ReadWrite.All Sites.ReadWrite.All offline_access',
    }),
  });
  return res.json();
}

function errorPage(message: string) {
  const html = `
    <html>
      <head><title>Connection Failed</title>
      <style>
        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #E4E3E0; margin: 0; }
        .card { background: white; padding: 2rem; border: 1px solid #141414; box-shadow: 8px 8px 0px 0px #141414; text-align: center; max-width: 400px; }
        h1 { margin-top: 0; font-size: 1.5rem; color: #dc2626; }
        p { color: #666; }
      </style>
      </head>
      <body>
        <div class="card">
          <h1>Connection Failed</h1>
          <p>${message}</p>
          <p>Please close this window and try again.</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${message}' }, '*');
            setTimeout(() => window.close(), 3000);
          }
        </script>
      </body>
    </html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

function successPage(provider: string) {
  const html = `
    <html>
      <head><title>Connection Successful</title>
      <style>
        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #E4E3E0; margin: 0; }
        .card { background: white; padding: 2rem; border: 1px solid #141414; box-shadow: 8px 8px 0px 0px #141414; text-align: center; max-width: 400px; }
        h1 { margin-top: 0; font-size: 1.5rem; }
        p { color: #666; }
        .check { font-size: 3rem; }
      </style>
      </head>
      <body>
        <div class="card">
          <div class="check">✅</div>
          <h1>Connection Successful</h1>
          <p>Your ${provider} account has been connected.</p>
          <p>This window will close automatically.</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: '${provider}' }, '*');
            setTimeout(() => window.close(), 2000);
          } else {
            window.location.href = '/dashboard/settings';
          }
        </script>
      </body>
    </html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Provider is passed via 'state' param since Google doesn't allow query params in redirect URIs
  const provider = searchParams.get('state') || searchParams.get('provider');
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // User denied access
  if (error) {
    return errorPage('Access was denied. Please try again.');
  }

  if (!code || !provider) {
    return errorPage('Missing authorization code.');
  }

  // Get current user from cookie
  let userId: string | null = null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    }
  } catch {
    return errorPage('Session expired. Please log in again.');
  }

  if (!userId) {
    return errorPage('You must be logged in to connect an account.');
  }

  const redirectUri = `${APP_URL}/api/auth/callback`;

  try {
    let tokenData: any;

    if (provider === 'google') {
      tokenData = await exchangeGoogleCode(code, redirectUri);
    } else if (provider === 'microsoft') {
      tokenData = await exchangeMicrosoftCode(code, redirectUri);
    } else {
      return errorPage('Unknown provider.');
    }

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData);
      return errorPage(`Failed to connect: ${tokenData.error_description || tokenData.error}`);
    }

    // Save tokens to DB
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    // Check if token already exists for this user+provider
    const existing = await prisma.oAuthToken.findFirst({
      where: { userId: userId!, provider },
    });

    if (existing) {
      await prisma.oAuthToken.update({
        where: { id: existing.id },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          expiresAt,
        },
      });
    } else {
      await prisma.oAuthToken.create({
        data: {
          userId: userId!,
          provider,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          expiresAt,
        },
      });
    }

    return successPage(provider);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return errorPage('An unexpected error occurred.');
  }
}
