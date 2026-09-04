import { createUploadthing, type FileRouter } from 'uploadthing/next';

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
