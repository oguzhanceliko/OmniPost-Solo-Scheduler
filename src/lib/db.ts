import { MongoClient, Db, Collection } from 'mongodb';
import { ScheduledPost, PostStatus, Platform, CustomCaptions, Account, AccountCredentials } from '@/types';

// MongoDB bağlantı yapılandırması
const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.warn('[MongoDB] MONGODB_URI ortam değişkeni tanımlı değil. Veritabanı işlemleri başarısız olacaktır.');
}

// Bağlantı havuzu (connection pool) - Serverless ortamlar için önemli
let client: MongoClient | null = null;
let db: Db | null = null;

async function getDb(): Promise<Db> {
  if (db) return db;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI ortam değişkeni tanımlı değil. Lütfen MongoDB Atlas bağlantı bilgisini ekleyin.');
  }

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(); // URI'deki veritabanı adını kullanır
  return db;
}

function getAccountsCollection(): Promise<Collection> {
  return getDb().then((database) => database.collection('accounts'));
}

function getPostsCollection(): Promise<Collection> {
  return getDb().then((database) => database.collection('posts'));
}

// initDb artık MongoDB'de tablo oluşturmaya gerek yok (koleksiyonlar otomatik oluşur)
export async function initDb() {
  await getDb();
}

// ==================== HESAPLAR (ACCOUNTS) ====================

export async function getAllAccounts(): Promise<Account[]> {
  const col = await getAccountsCollection();
  const docs = await col.find({}).sort({ created_at: 1 }).toArray();

  return docs.map((doc) => ({
    id: String(doc.id),
    platform: String(doc.platform) as Platform,
    name: String(doc.name),
    credentials: (doc.credentials || {}) as AccountCredentials,
    is_active: Boolean(doc.is_active),
    created_at: String(doc.created_at),
  }));
}

export async function getAccountById(id: string): Promise<Account | null> {
  const col = await getAccountsCollection();
  const doc = await col.findOne({ id });

  if (!doc) return null;

  return {
    id: String(doc.id),
    platform: String(doc.platform) as Platform,
    name: String(doc.name),
    credentials: (doc.credentials || {}) as AccountCredentials,
    is_active: Boolean(doc.is_active),
    created_at: String(doc.created_at),
  };
}

export async function createAccount(acc: Account): Promise<void> {
  const col = await getAccountsCollection();
  await col.insertOne({
    id: acc.id,
    platform: acc.platform,
    name: acc.name,
    credentials: acc.credentials,
    is_active: acc.is_active,
    created_at: acc.created_at,
  });
}

export async function updateAccount(acc: Account): Promise<void> {
  const col = await getAccountsCollection();
  await col.updateOne(
    { id: acc.id },
    {
      $set: {
        name: acc.name,
        credentials: acc.credentials,
        is_active: acc.is_active,
      },
    }
  );
}

export async function deleteAccount(id: string): Promise<void> {
  const col = await getAccountsCollection();
  await col.deleteOne({ id });
}

// ==================== GÖNDERİLER (POSTS) ====================

export async function getAllPosts(): Promise<ScheduledPost[]> {
  const col = await getPostsCollection();
  const docs = await col.find({}).sort({ schedule_time: 1 }).toArray();

  return docs.map(mapDocToPost);
}

export async function getPostById(id: string): Promise<ScheduledPost | null> {
  const col = await getPostsCollection();
  const doc = await col.findOne({ id });

  if (!doc) return null;
  return mapDocToPost(doc);
}

export async function getPendingDuePosts(nowIso: string): Promise<ScheduledPost[]> {
  const col = await getPostsCollection();
  const docs = await col
    .find({
      status: 'PENDING',
      schedule_time: { $lte: nowIso },
    })
    .sort({ schedule_time: 1 })
    .toArray();

  return docs.map(mapDocToPost);
}

export async function createPost(post: ScheduledPost): Promise<void> {
  const col = await getPostsCollection();
  await col.insertOne({
    id: post.id,
    video_url: post.video_url,
    video_key: post.video_key,
    caption: post.caption,
    custom_captions: post.custom_captions || null,
    schedule_time: post.schedule_time,
    platforms: post.platforms,
    target_account_ids: post.target_account_ids || null,
    target_account_names: post.target_account_names || null,
    status: post.status,
    log: post.log || null,
    created_at: post.created_at,
  });
}

export async function updatePostStatus(
  id: string,
  status: PostStatus,
  log?: string | null
): Promise<void> {
  const col = await getPostsCollection();
  const updateFields: Record<string, unknown> = { status };
  if (log !== undefined && log !== null) {
    updateFields.log = log;
  }
  await col.updateOne({ id }, { $set: updateFields });
}

export async function deletePost(id: string): Promise<void> {
  const col = await getPostsCollection();
  await col.deleteOne({ id });
}

// ==================== YARDIMCI ====================

function mapDocToPost(doc: any): ScheduledPost {
  return {
    id: String(doc.id),
    video_url: String(doc.video_url),
    video_key: String(doc.video_key),
    caption: String(doc.caption),
    custom_captions: doc.custom_captions as CustomCaptions | undefined,
    schedule_time: String(doc.schedule_time),
    platforms: doc.platforms as Platform[],
    target_account_ids: doc.target_account_ids as string[] | undefined,
    target_account_names: doc.target_account_names as string[] | undefined,
    status: String(doc.status) as PostStatus,
    log: doc.log ? String(doc.log) : null,
    created_at: String(doc.created_at),
  };
}
