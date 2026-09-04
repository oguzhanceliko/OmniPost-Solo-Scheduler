import { createUploadthing, type FileRouter } from 'uploadthing/next';

if (!process.env.UPLOADTHING_TOKEN) {
  process.env.UPLOADTHING_TOKEN = 'eyJhcGlLZXkiOiJza19saXZlXzc3ZGRjNmExOTFjOWZhYTk3NDcxY2VlNzZlNjZlYTg2MzcyODE4ZTFkMDQyNzJlNmRiN2Q5ZmJmNWY5NjhlYjgiLCJhcHBJZCI6ImUxN2N6cWRlangiLCJyZWdpb25zIjpbInNlYTEiXX0=';
}

const f = createUploadthing();

export const ourFileRouter = {
  videoUploader: f({
    video: {
      maxFileSize: '256MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return {
        url: file.ufsUrl || file.url,
        key: file.key,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
