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

    // 2. Videoyu indir ve buffer al (TikTok FILE_UPLOAD doğrudan dosya yükleme gerektirir, URL doğrulaması istemez)
    const videoRes = await fetch(params.videoUrl);
    if (!videoRes.ok) {
      throw new Error(`Video dosyası indirilemedi (HTTP ${videoRes.status})`);
    }
    const arrayBuffer = await videoRes.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);
    const totalBytes = videoBuffer.length;

    if (totalBytes === 0) {
      throw new Error('Video dosyası boş (0 byte).');
    }

    // 3. TikTok Content Posting API v2: FILE_UPLOAD
    // TikTok: 64 MB'a kadar tek parça (single chunk) upload destekler.
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB chunks if > 64 MB
    const isSingleChunk = totalBytes <= 64 * 1024 * 1024;
    const chunkSize = isSingleChunk ? totalBytes : CHUNK_SIZE;
    const totalChunkCount = isSingleChunk ? 1 : Math.floor(totalBytes / chunkSize);

    const initRes = await fetch(
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
            source: 'FILE_UPLOAD',
            video_size: totalBytes,
            chunk_size: chunkSize,
            total_chunk_count: totalChunkCount,
          },
        }),
      }
    );

    const initData = await initRes.json();
    if (!initRes.ok || initData.error?.code !== 'ok') {
      const errMsg =
        initData.error?.message ||
        initData.message ||
        `TikTok API Başlatma Hatası (Kod: ${initData.error?.code || initRes.status})`;
      throw new Error(errMsg);
    }

    const uploadUrl = initData.data?.upload_url;
    const publishId = initData.data?.publish_id;

    if (!uploadUrl) {
      throw new Error('TikTok upload_url sağlamadı.');
    }

    // 4. Video dosyasını TikTok upload_url'e aktar
    if (isSingleChunk) {
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': `${totalBytes}`,
          'Content-Range': `bytes 0-${totalBytes - 1}/${totalBytes}`,
        },
        body: videoBuffer,
      });

      if (!putRes.ok && putRes.status !== 201 && putRes.status !== 200) {
        const errText = await putRes.text();
        throw new Error(`Video TikTok sunucusuna yüklenemedi (HTTP ${putRes.status}): ${errText}`);
      }
    } else {
      // Çoklu chunk yükleme
      for (let i = 0; i < totalChunkCount; i++) {
        const start = i * chunkSize;
        const end = i === totalChunkCount - 1 ? totalBytes : (i + 1) * chunkSize;
        const chunk = videoBuffer.subarray(start, end);
        const chunkLen = chunk.length;

        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Length': `${chunkLen}`,
            'Content-Range': `bytes ${start}-${end - 1}/${totalBytes}`,
          },
          body: chunk,
        });

        if (!putRes.ok && putRes.status !== 201 && putRes.status !== 200) {
          const errText = await putRes.text();
          throw new Error(`Chunk ${i + 1}/${totalChunkCount} yüklenemedi: ${errText}`);
        }
      }
    }

    return { success: true, publishId: publishId || `tt_${Date.now()}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[TikTok Error]', message);
    return { success: false, error: `TikTok Hatası: ${message}` };
  }
}
