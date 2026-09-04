export interface TikTokUploadParams {
  videoUrl: string;
  caption: string;
  accessToken?: string;
}

export async function publishToTikTok(
  params: TikTokUploadParams
): Promise<{ success: boolean; publishId?: string; error?: string }> {
  const accessToken = params.accessToken || process.env.TIKTOK_ACCESS_TOKEN;

  if (!accessToken) {
    console.log(`[TikTok Mock] Publishing to TikTok: "${params.caption}" from ${params.videoUrl}`);
    return { success: true, publishId: `mock_tt_${Date.now()}` };
  }

  try {
    // TikTok Content Posting API v2: PULL_FROM_URL
    const res = await fetch(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          post_info: {
            title: params.caption.slice(0, 150),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000,
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: params.videoUrl,
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok || data.error?.code !== 'ok') {
      const errMsg = data.error?.message || data.message || 'TikTok API hatası';
      throw new Error(errMsg);
    }

    const publishId = data.data?.publish_id || `tt_${Date.now()}`;
    return { success: true, publishId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[TikTok Error]', message);
    return { success: false, error: `TikTok Hatası: ${message}` };
  }
}
