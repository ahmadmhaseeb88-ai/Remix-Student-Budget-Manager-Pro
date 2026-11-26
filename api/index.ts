import { createApiApp } from '../server/app.js';

const app = createApiApp();

export default function handler(req: any, res: any) {
  const rawUrl: string = typeof req.url === 'string' && req.url.length > 0 ? req.url : '/';

  try {
    const parsed = new URL(rawUrl, 'http://localhost');
    const vercelPath = parsed.searchParams.get('__vercel_path');

    if (vercelPath !== null) {
      parsed.searchParams.delete('__vercel_path');
      const cleanPath = vercelPath.replace(/^\/+/, '');
      const qs = parsed.searchParams.toString();
      req.url = `/api/${cleanPath}${qs ? `?${qs}` : ''}`;
    } else if (parsed.pathname === '/api/index' || parsed.pathname === '/index') {
      const forwardedUri =
        (typeof req.headers?.['x-forwarded-uri'] === 'string' && req.headers['x-forwarded-uri']) ||
        (typeof req.headers?.['x-invoke-path'] === 'string' && req.headers['x-invoke-path']) ||
        '';
      if (forwardedUri.startsWith('/api') && !forwardedUri.startsWith('/api/index')) {
        req.url = forwardedUri;
      }
    } else if (!rawUrl.startsWith('/api')) {
      req.url = `/api${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    }
  } catch {
    if (!rawUrl.startsWith('/api')) {
      req.url = `/api${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    }
  }

  return app(req, res);
}
