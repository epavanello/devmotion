/**
 * Configurable S3-compatible storage provider
 *
 * Supports any S3-compatible service (AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces, etc.)
 * Configure via environment variables.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import {
  PRIVATE_S3_BUCKET,
  PRIVATE_S3_REGION,
  PRIVATE_S3_ENDPOINT,
  PRIVATE_S3_ACCESS_KEY_ID,
  PRIVATE_S3_SECRET_ACCESS_KEY,
  PRIVATE_S3_PUBLIC_URL
} from '$env/static/private';

export interface StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
}

function getConfig(): StorageConfig {
  return {
    bucket: PRIVATE_S3_BUCKET || 'devmotion-uploads',
    region: PRIVATE_S3_REGION || 'us-east-1',
    endpoint: PRIVATE_S3_ENDPOINT || undefined,
    accessKeyId: PRIVATE_S3_ACCESS_KEY_ID || '',
    secretAccessKey: PRIVATE_S3_SECRET_ACCESS_KEY || '',
    publicUrl: PRIVATE_S3_PUBLIC_URL || undefined
  };
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const config = getConfig();

  _client = new S3Client({
    region: config.region,
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    forcePathStyle: !!config.endpoint // Required for MinIO and some S3-compatible services
  });

  return _client;
}

export type MediaType = 'image' | 'video' | 'audio';

/**
 * Allowed MIME types per media category
 */
const ALLOWED_MIME_TYPES: Record<MediaType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/aac']
};

const MAX_FILE_SIZES: Record<MediaType, number> = {
  image: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB
  audio: 100 * 1024 * 1024 // 100MB
};

/**
 * Get the file extension from a MIME type
 */
function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'weba',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac'
  };
  return map[mimeType] || 'bin';
}

/**
 * Validate that a file's MIME type is allowed for the given media category
 */
export function validateMediaType(mimeType: string, mediaType: MediaType): boolean {
  return ALLOWED_MIME_TYPES[mediaType].includes(mimeType);
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, mediaType: MediaType): boolean {
  return size <= MAX_FILE_SIZES[mediaType];
}

export interface UploadResult {
  /** Unique file ID (used as the storage key) */
  fileId: string;
  /** The S3 key */
  key: string;
  /** Public URL to access the file */
  url: string;
  /** Original filename */
  originalName: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Media type category */
  mediaType: MediaType;
}

/**
 * Upload a file to S3-compatible storage
 */
export async function uploadFile(
  file: Buffer | Uint8Array,
  originalName: string,
  mimeType: string,
  mediaType: MediaType,
  projectId?: string
): Promise<UploadResult> {
  const config = getConfig();
  const client = getClient();

  const fileId = nanoid();
  const ext = getExtension(mimeType);
  const prefix = projectId ? `projects/${projectId}` : 'uploads';
  const key = `${prefix}/${mediaType}/${fileId}.${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable'
    })
  );

  // Build public URL
  let url: string;
  if (config.publicUrl) {
    url = `${config.publicUrl}/${key}`;
  } else if (config.endpoint) {
    url = `${config.endpoint}/${config.bucket}/${key}`;
  } else {
    url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  }

  return {
    fileId,
    key,
    url,
    originalName,
    mimeType,
    size: file.length,
    mediaType
  };
}

/**
 * Get a signed URL for temporary access to a file
 */
export async function getSignedFileUrl(key: string, expiresIn = 3600): Promise<string> {
  const config = getConfig();
  const client = getClient();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  const config = getConfig();
  const client = getClient();

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key
    })
  );
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(key: string): Promise<boolean> {
  const config = getConfig();
  const client = getClient();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: key
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect media type from MIME type
 */
export function detectMediaType(mimeType: string): MediaType | null {
  for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type as MediaType;
    }
  }
  return null;
}

/**
 * Check if storage is configured (has credentials)
 */
export function isStorageConfigured(): boolean {
  const config = getConfig();
  return !!(config.accessKeyId && config.secretAccessKey && config.bucket);
}
