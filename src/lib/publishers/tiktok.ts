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
    return {
      success: false,
      error: 'TikTok Access Token bulunamadı. Lütfen paylaşım yaparken TikTok hesabınızı seçin.',
    };
  }

  try {
    // 1. Creator info sorgulayarak izin verilen gizlilik seviyesini bul (Sandbox için genellikle SELF_ONLY gereklidir)
    let privacyLevel = 'SELF_ONLY';
    try {
      const creatorRes = await fetch(
        'https://open.tiktokapis.com/v2/post/publish/creator_info/query/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
        }
      );
      const creatorData = await creatorRes.json();
      const options = creatorData?.data?.privacy_level_options;
      if (Array.isArray(options) && options.length > 0) {
        if (options.includes('PUBLIC_TO_EVERYONE')) {
          privacyLevel = 'PUBLIC_TO_EVERYONE';
        } else if (options.includes('MUTUAL_FOLLOW_FRIENDS')) {
          privacyLevel = 'MUTUAL_FOLLOW_FRIENDS';
        } else if (options.includes('SELF_ONLY')) {
          privacyLevel = 'SELF_ONLY';
        }
      }
    } catch (cErr) {
      console.warn('[TikTok Creator Info Query]', cErr);
    }

    // 2. TikTok Content Posting API v2: PULL_FROM_URL
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
            privacy_level: privacyLevel,
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
      const errMsg = data.error?.message || data.message || `TikTok API hatası (Kod: ${data.error?.code || res.status})`;
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
