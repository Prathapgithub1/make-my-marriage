import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });
process.env.SESSION_SECRET = 'test-session-secret-00000000000000000000000000000000';
process.env.CSRF_SECRET = 'test-csrf-secret-0000000000000000000000000000000000';
process.env.WEB_ORIGIN = 'http://localhost:1234';
