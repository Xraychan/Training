import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback?provider=${provider}`;

  let authUrl = '';

  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Google OAuth is not configured' }, { status: 500 });
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  } else if (provider === 'microsoft') {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Microsoft OAuth is not configured' }, { status: 500 });
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'Files.ReadWrite.All Sites.ReadWrite.All offline_access',
      response_mode: 'query',
    });
    authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

  } else {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  }

  return NextResponse.json({ url: authUrl });
}
