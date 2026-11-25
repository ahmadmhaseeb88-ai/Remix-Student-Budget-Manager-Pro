import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './apiRouter.js';

dotenv.config();

export function createApiApp() {
  const app = express();

  // Security and request parsing
  app.use(cors());
  // 50mb limit to handle high-resolution CamScanner receipt photo uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: 'PaisaTrack AI',
      time: new Date().toISOString(),
      ai_configured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Mount the core API routes
  app.use('/api', apiRouter);

  // Explicit JSON 404 handler for any unmatched /api routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.originalUrl} not found.` });
  });

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: err?.message || 'Internal server error occurred.' });
  });

  return app;
}
