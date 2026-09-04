import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'omnipost-videos';
const publicUrlBase = process.env.R2_PUBLIC_URL || '';

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && publicUrlBase
);

let s3Client: S3Client | null = null;

if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });
}

export async function createUploadUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const timestamp = Date.now();
  const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `videos/${timestamp}-${sanitizedName}`;

  if (!isR2Configured || !s3Client) {
    // Mock / Local Fallback for development without R2 credentials
    return {
      uploadUrl: `/api/upload/local?key=${encodeURIComponent(key)}`,
      publicUrl: `/api/media/${encodeURIComponent(key)}`,
      key,
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  // Presigned URL valid for 30 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 1800 });
  const publicUrl = `${publicUrlBase.replace(/\/$/, '')}/${key}`;

  return {
    uploadUrl,
    publicUrl,
    key,
  };
}

export async function deleteR2Object(key: string): Promise<boolean> {
  if (!isR2Configured || !s3Client) {
    console.log(`[R2 Cleanup Mock] Mock video deleted: ${key}`);
    return true;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await s3Client.send(command);
    console.log(`[R2 Cleanup] Successfully deleted video object: ${key}`);
    return true;
  } catch (error) {
    console.error(`[R2 Cleanup Error] Failed to delete ${key}:`, error);
    return false;
  }
}
