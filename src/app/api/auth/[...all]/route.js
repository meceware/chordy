import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/auth';

// Resolved per request so building this route does not open the database.
export async function GET(request) {
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request) {
  return toNextJsHandler(getAuth()).POST(request);
}
