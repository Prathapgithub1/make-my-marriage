import { Router } from 'express';
import { openApiDocument } from './openapi';

export const apiDocsRouter = Router();

apiDocsRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

apiDocsRouter.get('/swagger-init.js', (_req, res) => {
  res.type('application/javascript').send(`window.onload = () => SwaggerUIBundle({
  url: '/api-docs/openapi.json',
  dom_id: '#swagger-ui',
  deepLinking: true,
  withCredentials: true,
  requestInterceptor: (request) => {
    request.credentials = 'include';
    const csrfCookie = document.cookie.split('; ').find((cookie) => cookie.startsWith('mmm_csrf='));
    if (csrfCookie && request.url.includes('/api/v1/') && request.method !== 'GET') {
      request.headers['X-CSRF-Token'] = decodeURIComponent(csrfCookie.slice('mmm_csrf='.length));
    }
    return request;
  },
});`);
});

apiDocsRouter.get('/', (_req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; img-src 'self' data:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self';",
  );
  res.type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Make My Marriage API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="/api-docs/swagger-init.js"></script>
  </body>
</html>`);
});
