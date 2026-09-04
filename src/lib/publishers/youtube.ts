import { google } from 'googleapis';
import { Readable } from 'stream';

export interface YouTubeUploadParams {
  videoUrl: string;
  title: string;
  description: string;
}

export async function publishToYouTube(params: YouTubeUploadParams): Promise<{ success: boolean; videoId?: string; error?: string }> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    // If not configured, provide mock response for dev/test
    console.log(`[YouTube Mock] Publishing to YouTube Shorts: "${params.title}" from ${params.videoUrl}`);
    return { success: true, videoId: `mock_yt_${Date.now()}` };
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Fetch video stream from public URL (R2)
    const videoResponse = await fetch(params.videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video stream from URL: ${videoResponse.statusText}`);
    }

    const arrayBuffer = await videoResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const videoStream = Readable.from(buffer);

    // Prepare title (ensure #Shorts is included for best discovery)
    const safeTitle = params.title.includes('#Shorts') ? params.title : `${params.title} #Shorts`;

    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: safeTitle.slice(0, 100),
          description: params.description,
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: videoStream,
      },
    });

    const videoId = res.data.id || undefined;
    return { success: true, videoId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[YouTube Error]', message);
    return { success: false, error: `YouTube Hatası: ${message}` };
  }
}
