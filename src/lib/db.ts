import { createClient } from '@libsql/client';
import { ScheduledPost, PostStatus, Platform, CustomCaptions, Account, AccountCredentials } from '@/types';

function getDbUrl(): string {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }
  if (process.env.VERCEL) {
    return 'file:/tmp/local.db';
  }
  return 'file:local.db';
}

const dbUrl = getDbUrl();
const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url: dbUrl,
  authToken: dbAuthToken,
});

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id TEXT PRIMARY KEY,
      video_url TEXT NOT NULL,
      video_key TEXT NOT NULL,
      caption TEXT NOT NULL,
      custom_captions TEXT,
      schedule_time TEXT NOT NULL,
      platforms TEXT NOT NULL,
      target_account_ids TEXT,
      target_account_names TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      log TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      name TEXT NOT NULL,
      credentials TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tokens (
      platform TEXT PRIMARY KEY,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at INTEGER,
      updated_at TEXT NOT NULL
    );
  `);

  // Kolon ekleme kontrolleri (eski DB şeması varsa)
  try {
    await db.execute(`ALTER TABLE scheduled_posts ADD COLUMN target_account_ids TEXT;`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE scheduled_posts ADD COLUMN target_account_names TEXT;`);
  } catch {}

  isInitialized = true;
}

// ==================== HESAPLAR (ACCOUNTS) ====================

export async function getAllAccounts(): Promise<Account[]> {
  await initDb();
  const rs = await db.execute(`SELECT * FROM accounts ORDER BY created_at ASC`);

  return rs.rows.map((row) => ({
    id: String(row.id),
    platform: String(row.platform) as Platform,
    name: String(row.name),
    credentials: JSON.parse(String(row.credentials || '{}')) as AccountCredentials,
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
  }));
}

export async function getAccountById(id: string): Promise<Account | null> {
  await initDb();
  const rs = await db.execute({
    sql: `SELECT * FROM accounts WHERE id = ?`,
    args: [id],
  });

  if (rs.rows.length === 0) return null;
  const row = rs.rows[0];

  return {
    id: String(row.id),
    platform: String(row.platform) as Platform,
    name: String(row.name),
    credentials: JSON.parse(String(row.credentials || '{}')) as AccountCredentials,
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
  };
}

export async function createAccount(acc: Account): Promise<void> {
  await initDb();
  await db.execute({
    sql: `
      INSERT INTO accounts (id, platform, name, credentials, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [
      acc.id,
      acc.platform,
      acc.name,
      JSON.stringify(acc.credentials),
      acc.is_active ? 1 : 0,
      acc.created_at,
    ],
  });
}

export async function updateAccount(acc: Account): Promise<void> {
  await initDb();
  await db.execute({
    sql: `
      UPDATE accounts 
      SET name = ?, credentials = ?, is_active = ?
      WHERE id = ?
    `,
    args: [
      acc.name,
      JSON.stringify(acc.credentials),
      acc.is_active ? 1 : 0,
      acc.id,
    ],
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await initDb();
  await db.execute({
    sql: `DELETE FROM accounts WHERE id = ?`,
    args: [id],
  });
}

// ==================== GÖNDERİLER (POSTS) ====================

function mapPostRow(row: any): ScheduledPost {
  return {
    id: String(row.id),
    video_url: String(row.video_url),
    video_key: String(row.video_key),
    caption: String(row.caption),
    custom_captions: row.custom_captions ? (JSON.parse(String(row.custom_captions)) as CustomCaptions) : undefined,
    schedule_time: String(row.schedule_time),
    platforms: JSON.parse(String(row.platforms)) as Platform[],
    target_account_ids: row.target_account_ids ? (JSON.parse(String(row.target_account_ids)) as string[]) : undefined,
    target_account_names: row.target_account_names ? (JSON.parse(String(row.target_account_names)) as string[]) : undefined,
    status: String(row.status) as PostStatus,
    log: row.log ? String(row.log) : null,
    created_at: String(row.created_at),
  };
}

export async function getAllPosts(): Promise<ScheduledPost[]> {
  await initDb();
  const rs = await db.execute(`
    SELECT * FROM scheduled_posts ORDER BY schedule_time ASC
  `);

  return rs.rows.map(mapPostRow);
}

export async function getPostById(id: string): Promise<ScheduledPost | null> {
  await initDb();
  const rs = await db.execute({
    sql: `SELECT * FROM scheduled_posts WHERE id = ?`,
    args: [id],
  });

  if (rs.rows.length === 0) return null;
  return mapPostRow(rs.rows[0]);
}

export async function getPendingDuePosts(nowIso: string): Promise<ScheduledPost[]> {
  await initDb();
  const rs = await db.execute({
    sql: `
      SELECT * FROM scheduled_posts 
      WHERE status = 'PENDING' AND schedule_time <= ?
      ORDER BY schedule_time ASC
    `,
    args: [nowIso],
  });

  return rs.rows.map(mapPostRow);
}

export async function createPost(post: ScheduledPost): Promise<void> {
  await initDb();
  await db.execute({
    sql: `
      INSERT INTO scheduled_posts (
        id, video_url, video_key, caption, custom_captions, schedule_time, platforms,
        target_account_ids, target_account_names, status, log, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      post.id,
      post.video_url,
      post.video_key,
      post.caption,
      post.custom_captions ? JSON.stringify(post.custom_captions) : null,
      post.schedule_time,
      JSON.stringify(post.platforms),
      post.target_account_ids ? JSON.stringify(post.target_account_ids) : null,
      post.target_account_names ? JSON.stringify(post.target_account_names) : null,
      post.status,
      post.log || null,
      post.created_at,
    ],
  });
}

export async function updatePostStatus(
  id: string,
  status: PostStatus,
  log?: string | null
): Promise<void> {
  await initDb();
  await db.execute({
    sql: `
      UPDATE scheduled_posts 
      SET status = ?, log = COALESCE(?, log) 
      WHERE id = ?
    `,
    args: [status, log !== undefined ? log : null, id],
  });
}

export async function deletePost(id: string): Promise<void> {
  await initDb();
  await db.execute({
    sql: `DELETE FROM scheduled_posts WHERE id = ?`,
    args: [id],
  });
}
