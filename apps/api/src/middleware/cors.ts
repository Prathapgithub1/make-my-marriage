import type { RequestHandler } from 'express';

export function corsMiddleware(allowedOrigin: string): RequestHandler {
  return (req, res, next) => {
    const requestOrigin = req.header('Origin');
    const isLocalDev = process.env.NODE_ENV !== 'production';
    const isLocalhost = Boolean(
      requestOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin),
    );
    const isOriginAllowed = requestOrigin === allowedOrigin || (isLocalDev && isLocalhost);

    if (isOriginAllowed && requestOrigin) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.vary('Origin');

      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
        res.status(204).end();
        return;
      }
    } else if (req.method === 'OPTIONS') {
      res.status(403).end();
      return;
    }

    next();
  };
}
