export interface InstagramUploadParams {
  videoUrl: string;
  caption: string;
  accountId?: string;
  accessToken?: string;
}

export async function publishToInstagram(
  params: InstagramUploadParams
): Promise<{ success: boolean; mediaId?: string; error?: string }> {
  const accountId = params.accountId || process.env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = params.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accountId || !accessToken) {
    console.log(`[Instagram Mock] Publishing to Reels: "${params.caption}" from ${params.videoUrl}`);
    return { success: true, mediaId: `mock_ig_${Date.now()}` };
  }

  try {
    // Adım 1: Reels Container oluştur
    const createRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: params.videoUrl,
          caption: params.caption,
          access_token: accessToken,
        }),
      }
    );

    const createData = await createRes.json();
    if (!createRes.ok || !createData.id) {
      throw new Error(createData.error?.message || 'Instagram container oluşturulamadı');
    }

    const creationId = createData.id;

    // Adım 2: Video işleme durumunu bekle (polling, 2.5 sn aralıklarla)
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 36; // 36 * 2.5 sn = 90 sn

    while (!isReady && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      attempts++;

      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`
      );
      const statusData = await statusRes.json();

      if (statusData.status_code === 'FINISHED') {
        isReady = true;
      } else if (statusData.status_code === 'ERROR' || statusData.status_code === 'EXPIRED') {
        throw new Error(`Instagram video işleme hatası: ${statusData.status_code}`);
      }
    }

    if (!isReady) {
      throw new Error('Instagram video işleme zaman aşımına uğradı');
    }

    // Adım 3: Yayınla (Publish)
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      throw new Error(publishData.error?.message || 'Instagram gönderisi yayınlanamadı');
    }

    return { success: true, mediaId: publishData.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Instagram Error]', message);
    return { success: false, error: `Instagram Hatası: ${message}` };
  }
}
