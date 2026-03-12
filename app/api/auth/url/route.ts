import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback?provider=${provider}`;

  let authUrl = '';

  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || 'dummy_google_id',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
      access_type: 'offline',
      prompt: 'consent',
    });
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  } else if (provider === 'microsoft') {
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || 'dummy_ms_id',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'Files.ReadWrite.All Sites.ReadWrite.All',
      response_mode: 'query',
    });
    authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  return NextResponse.json({ url: authUrl });
}
