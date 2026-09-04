import { ScheduledPost } from '@/types';
import { updatePostStatus, getAccountById } from '@/lib/db';
import { deleteR2Object } from '@/lib/r2';
import { publishToYouTube } from './youtube';
import { publishToInstagram } from './instagram';
import { publishToTikTok } from './tiktok';

export async function processPostPublication(
  post: ScheduledPost
): Promise<{ success: boolean; log: string }> {
  // Statüyü PROCESSING yap
  await updatePostStatus(post.id, 'PROCESSING');

  const logs: string[] = [];
  let allSuccess = true;

  // Hedef hesapları çek (eğer seçilmişse)
  const targetAccounts = [];
  if (post.target_account_ids && post.target_account_ids.length > 0) {
    for (const accId of post.target_account_ids) {
      const acc = await getAccountById(accId);
      if (acc && acc.is_active) {
        targetAccounts.push(acc);
      }
    }
  }

  for (const platform of post.platforms) {
    // Bu platforma ait hedeflenmiş özel hesaplar var mı?
    const platformAccounts = targetAccounts.filter((a) => a.platform === platform);

    // Eğer hesaba özel seçim yoksa (varsayılan fallback: process.env)
    const accountsToRun = platformAccounts.length > 0 ? platformAccounts : [null];

    for (const acc of accountsToRun) {
      const accName = acc ? ` (${acc.name})` : '';

      if (platform === 'YOUTUBE') {
        const title = post.custom_captions?.youtube || post.caption;
        const desc = post.caption;
        const ytResult = await publishToYouTube({
          videoUrl: post.video_url,
          title,
          description: desc,
          clientId: acc?.credentials?.clientId,
          clientSecret: acc?.credentials?.clientSecret,
          refreshToken: acc?.credentials?.refreshToken,
        });

        if (ytResult.success) {
          logs.push(`YouTube${accName}: Başarılı (Video ID: ${ytResult.videoId || 'OK'})`);
        } else {
          allSuccess = false;
          logs.push(`YouTube${accName} Hata: ${ytResult.error}`);
        }
      }

      if (platform === 'INSTAGRAM') {
        const caption = post.custom_captions?.instagram || post.caption;
        const igResult = await publishToInstagram({
          videoUrl: post.video_url,
          caption,
          accountId: acc?.credentials?.instagramAccountId,
          accessToken: acc?.credentials?.instagramAccessToken,
        });

        if (igResult.success) {
          logs.push(`Instagram${accName}: Başarılı (Media ID: ${igResult.mediaId || 'OK'})`);
        } else {
          allSuccess = false;
          logs.push(`Instagram${accName} Hata: ${igResult.error}`);
        }
      }

      if (platform === 'TIKTOK') {
        const caption = post.custom_captions?.tiktok || post.caption;
        const ttResult = await publishToTikTok({
          videoUrl: post.video_url,
          caption,
          accessToken: acc?.credentials?.tiktokAccessToken,
        });

        if (ttResult.success) {
          logs.push(`TikTok${accName}: Başarılı (Publish ID: ${ttResult.publishId || 'OK'})`);
        } else {
          allSuccess = false;
          logs.push(`TikTok${accName} Hata: ${ttResult.error}`);
        }
      }
    }
  }

  const finalLog = logs.join('\n');

  if (allSuccess) {
    await updatePostStatus(post.id, 'DONE', finalLog);
    // Otomatik temizleme: Video başarıyla paylaşıldıktan sonra R2'den silinir
    if (post.video_key) {
      await deleteR2Object(post.video_key);
    }
    return { success: true, log: finalLog };
  } else {
    await updatePostStatus(post.id, 'FAILED', finalLog);
    return { success: false, log: finalLog };
  }
}
