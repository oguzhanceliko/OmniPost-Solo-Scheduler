export type Platform = 'YOUTUBE' | 'INSTAGRAM' | 'TIKTOK';

export type PostStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface CustomCaptions {
  youtube?: string;
  instagram?: string;
  tiktok?: string;
}

export interface ScheduledPost {
  id: string;
  video_url: string;
  video_key: string;
  caption: string;
  custom_captions?: CustomCaptions;
  schedule_time: string; // ISO 8601 string
  platforms: Platform[];
  status: PostStatus;
  log?: string | null;
  created_at: string;
}

export interface PlatformToken {
  platform: Platform;
  access_token: string;
  refresh_token?: string | null;
  expires_at?: number | null;
  updated_at: string;
}
