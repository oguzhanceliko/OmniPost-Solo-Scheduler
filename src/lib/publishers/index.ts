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

  try {
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

    // Platform görevlerini paralel (eşzamanlı) çalıştırarak zaman aşımını önle
    const tasks: Promise<void>[] = [];

    for (const platform of post.platforms) {
      // Bu platforma ait hedeflenmiş özel hesaplar var mı?
      const platformAccounts = targetAccounts.filter((a) => a.platform === platform);
      const accountsToRun = platformAccounts.length > 0 ? platformAccounts : [null];

      for (const acc of accountsToRun) {
        const accName = acc ? ` (${acc.name})` : '';

        if (platform === 'YOUTUBE') {
          tasks.push(
            (async () => {
              const title = post.custom_captions?.youtube || post.caption;
              const desc = post.description || post.caption;
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
            })()
          );
        }

        if (platform === 'INSTAGRAM') {
          tasks.push(
            (async () => {
              const fullCaption = post.description ? `${post.caption}\n\n${post.description}` : post.caption;
              const caption = post.custom_captions?.instagram || fullCaption;
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
            })()
          );
        }

        if (platform === 'TIKTOK') {
          tasks.push(
            (async () => {
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
            })()
          );
        }
      }
    }

    // Tüm platform yayınlarını paralel bekle
    await Promise.allSettled(tasks);

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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const failLog = `Yayınlama işleminde beklenmeyen hata: ${msg}`;
    await updatePostStatus(post.id, 'FAILED', failLog);
    return { success: false, log: failLog };
  }
}
