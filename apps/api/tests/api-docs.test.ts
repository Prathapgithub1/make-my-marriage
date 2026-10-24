import request from 'supertest';
import { createApp } from '../src/app';

describe('Swagger API documentation', () => {
  const app = createApp();

  it('serves the interactive Swagger UI locally', async () => {
    const response = await request(app).get('/api-docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui-dist@5/swagger-ui.css');
    expect(response.text).toContain('/api-docs/swagger-init.js');
    expect(response.headers['content-security-policy']).toContain('https://cdn.jsdelivr.net');
  });

  it('adds CSRF and cookie credentials to Swagger write requests', async () => {
    const response = await request(app).get('/api-docs/swagger-init.js');

    expect(response.status).toBe(200);
    expect(response.text).toContain("request.credentials = 'include'");
    expect(response.text).toContain("request.headers['X-CSRF-Token']");
  });

  it('publishes the OpenAPI document with every implemented API route', async () => {
    const response = await request(app).get('/api-docs/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining([
        '/health',
        '/health/database',
        '/auth/csrf',
        '/auth/signup',
        '/auth/login',
        '/auth/logout',
        '/auth/me',
        '/auth/forgot-password',
        '/auth/reset-password',
      ]),
    );
  });
});
