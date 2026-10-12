import pino from 'pino';
import request from 'supertest';
import { createApp } from '../src/app';

const testApp = createApp(pino({ level: 'silent' }));

describe('GET /api/v1/health', () => {
  it('returns the service status and a request ID', async () => {
    const response = await request(testApp).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ data: { status: 'ok' } });
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('allows credentialed requests from the configured web origin only', async () => {
    const allowed = await request(testApp)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:1234');
    const rejectedPreflight = await request(testApp)
      .options('/api/v1/health')
      .set('Origin', 'https://untrusted.example');

    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:1234');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    expect(rejectedPreflight.status).toBe(403);
  });

  it('returns a standardized not-found response', async () => {
    const response = await request(testApp).get('/api/v1/missing');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.requestId).toBe(response.headers['x-request-id']);
  });
});
