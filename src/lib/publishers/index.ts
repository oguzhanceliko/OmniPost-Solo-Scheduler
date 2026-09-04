import { ScheduledPost } from '@/types';
import { updatePostStatus } from '@/lib/db';
import { deleteR2Object } from '@/lib/r2';
import { publishToYouTube } from './youtube';
import { publishToInstagram } from './instagram';
import { publishToTikTok } from './tiktok';

export async function processPostPublication(post: ScheduledPost): Promise<{ success: boolean; log: string }> {
  // Statüyü PROCESSING yap
  await updatePostStatus(post.id, 'PROCESSING');

  const logs: string[] = [];
  let allSuccess = true;

  for (const platform of post.platforms) {
    if (platform === 'YOUTUBE') {
      const title = post.custom_captions?.youtube || post.caption;
      const desc = post.caption;
      const ytResult = await publishToYouTube({
        videoUrl: post.video_url,
        title,
        description: desc,
      });

      if (ytResult.success) {
        logs.push(`YouTube: Başarılı (Video ID: ${ytResult.videoId || 'OK'})`);
      } else {
        allSuccess = false;
        logs.push(`YouTube Hata: ${ytResult.error}`);
      }
    }

    if (platform === 'INSTAGRAM') {
      const caption = post.custom_captions?.instagram || post.caption;
      const igResult = await publishToInstagram({
        videoUrl: post.video_url,
        caption,
      });

      if (igResult.success) {
        logs.push(`Instagram: Başarılı (Media ID: ${igResult.mediaId || 'OK'})`);
      } else {
        allSuccess = false;
        logs.push(`Instagram Hata: ${igResult.error}`);
      }
    }

    if (platform === 'TIKTOK') {
      const caption = post.custom_captions?.tiktok || post.caption;
      const ttResult = await publishToTikTok({
        videoUrl: post.video_url,
        caption,
      });

      if (ttResult.success) {
        logs.push(`TikTok: Başarılı (Publish ID: ${ttResult.publishId || 'OK'})`);
      } else {
        allSuccess = false;
        logs.push(`TikTok Hata: ${ttResult.error}`);
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
