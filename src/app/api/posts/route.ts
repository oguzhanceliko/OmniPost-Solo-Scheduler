import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAllPosts, createPost, deletePost, getPostById } from '@/lib/db';
import { deleteR2Object } from '@/lib/r2';
import { ScheduledPost } from '@/types';
import crypto from 'crypto';

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const posts = await getAllPosts();
    return NextResponse.json({ posts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gönderiler getirilemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      video_url,
      video_key,
      caption,
      custom_captions,
      schedule_time,
      platforms,
      target_account_ids,
      target_account_names,
    } = body;

    if (!video_url || !caption || !schedule_time || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Lütfen video, başlık/açıklama, tarih ve en az bir platform seçin' },
        { status: 400 }
      );
    }

    const newPost: ScheduledPost = {
      id: crypto.randomUUID(),
      video_url,
      video_key: video_key || '',
      caption,
      custom_captions: custom_captions || undefined,
      schedule_time: new Date(schedule_time).toISOString(),
      platforms,
      target_account_ids: target_account_ids || undefined,
      target_account_names: target_account_names || undefined,
      status: 'PENDING',
      log: null,
      created_at: new Date().toISOString(),
    };

    await createPost(newPost);
    return NextResponse.json({ success: true, post: newPost });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gönderi kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parametresi gereklidir' }, { status: 400 });
    }

    const post = await getPostById(id);
    if (post && post.video_key && post.status === 'PENDING') {
      // Eğer henüz yayınlanmamış ve iptal edildiyse, R2'deki videoyu da silip kotayı koruyalım
      await deleteR2Object(post.video_key);
    }

    await deletePost(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gönderi silinemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
