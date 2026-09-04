import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from '@/lib/uploadthing';

if (!process.env.UPLOADTHING_TOKEN) {
  process.env.UPLOADTHING_TOKEN = 'eyJhcGlLZXkiOiJza19saXZlXzc3ZGRjNmExOTFjOWZhYTk3NDcxY2VlNzZlNjZlYTg2MzcyODE4ZTFkMDQyNzJlNmRiN2Q5ZmJmNWY5NjhlYjgiLCJhcHBJZCI6ImUxN2N6cWRlangiLCJyZWdpb25zIjpbInNlYTEiXX0=';
}

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
