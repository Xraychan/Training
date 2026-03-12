import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const code = searchParams.get('code');

  // In a real app, you would exchange the code for tokens here
  // and store them securely.
  
  const html = `
    <html>
      <head>
        <title>Authentication Successful</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #E4E3E0; margin: 0; }
          .card { background: white; padding: 2rem; border: 1px solid #141414; box-shadow: 8px 8px 0px 0px #141414; text-align: center; }
          h1 { margin-top: 0; font-size: 1.5rem; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Connection Successful</h1>
          <p>You have successfully connected your ${provider} account.</p>
          <p>This window will close automatically.</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_AUTH_SUCCESS', 
              provider: '${provider}' 
            }, '*');
            setTimeout(() => window.close(), 2000);
          } else {
            window.location.href = '/dashboard/settings';
          }
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
