import { beforeAll } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/smart-edge-test';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-at-least-32-chars!!';
process.env.CSRF_SECRET = process.env.CSRF_SECRET || 'test-csrf-secret-16';
process.env.PUBLIC_API_URL = process.env.PUBLIC_API_URL || 'http://localhost:4000';
