import { createApiApp } from '../server/app.js';

const app = createApiApp();

export default function handler(req: any, res: any) {
  const rawUrl: string = req.url || '/';
  const parsed = new URL(rawUrl, 'http://localhost');
  const vercelPath = parsed.searchParams.get('__vercel_path');

  if (vercelPath !== null) {
    parsed.searchParams.delete('__vercel_path');
    const cleanPath = vercelPath.replace(/^\/+/, '');
    const qs = parsed.searchParams.toString();
    req.url = `/api/${cleanPath}${qs ? `?${qs}` : ''}`;
  } else if (!rawUrl.startsWith('/api')) {
    req.url = `/api${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  }

  return app(req, res);
}
