import type { RequestHandler } from 'express';

export function corsMiddleware(allowedOrigin: string): RequestHandler {
  return (req, res, next) => {
    const requestOrigin = req.header('Origin');

    if (requestOrigin === allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.vary('Origin');

      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
