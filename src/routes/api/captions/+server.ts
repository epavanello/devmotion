/**
 * AI Caption Generation API
 *
 * Generates timed captions/subtitles for audio files using OpenAI Whisper.
 * Returns captions in the timed format expected by AudioLayer:
 *   "MM:SS.ms - MM:SS.ms | caption text"
 */
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import { z } from 'zod';
import { getSignedFileUrl } from '$lib/server/storage';
import { sanitizeForFFmpeg } from '$lib/server/utils/filename-sanitizer';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';

/** Input validation schema */
const CaptionRequestSchema = z.object({
  fileKey: z.string().min(1, 'File key is required'),
  language: z.string().optional(),
  style: z.enum(['subtitle', 'caption', 'lyrics']).optional(),
  /** Start time in the source audio (contentOffset) */
  mediaStartTime: z.number().min(0).optional(),
  /** End time in the source audio (contentOffset + layer duration) */
  mediaEndTime: z.number().min(0).optional(),
  /** Optional text to guide the transcription (e.g., song lyrics, context) */
  prompt: z.string().max(5000).optional()
});

/**
 * Trim audio using FFmpeg
 */
async function trimAudio(audioUrl: string, startTime: number, endTime: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = new PassThrough();

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    // Sanitize URL to ensure FFmpeg compatibility (remove emojis and special chars)
    const sanitizedUrl = sanitizeForFFmpeg(audioUrl);

    ffmpeg(sanitizedUrl)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .outputFormat('mp3')
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .on('error', (err) => {
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .pipe(stream);
  });
}

/**
 * POST /api/captions
 *
 * Generates timed captions for uploaded audio files using OpenAI Whisper.
 * Only accepts files from trusted storage via fileKey.
 * Supports trimming audio to specific time ranges via mediaStartTime/mediaEndTime.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user?.id) {
    error(401, 'Unauthorized');
  }

  try {
    const body = await request.json();

    // Validate request body
    const result = CaptionRequestSchema.safeParse(body);
    if (!result.success) {
      error(400, `Invalid request: ${result.error.message}`);
    }

    const { fileKey, language, mediaStartTime, mediaEndTime, prompt } = result.data;

    // Get signed URL for the uploaded file from trusted storage
    const finalAudioUrl = await getSignedFileUrl(fileKey, 3600);

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      error(503, 'AI service not configured (OPENAI_API_KEY missing)');
    }

    let audioBuffer: ArrayBuffer;
    let ext = 'mp3';

    // If we need to trim the audio, use FFmpeg
    if (
      mediaStartTime !== undefined &&
      mediaEndTime !== undefined &&
      (mediaStartTime > 0 || isFinite(mediaEndTime))
    ) {
      console.log(`Trimming audio from ${mediaStartTime}s to ${mediaEndTime}s`);
      const trimmedBuffer = await trimAudio(finalAudioUrl, mediaStartTime, mediaEndTime);
      audioBuffer = new Uint8Array(trimmedBuffer).buffer;
      ext = 'mp3'; // FFmpeg outputs as MP3
    } else {
      // Use full audio file
      const audioResponse = await fetch(finalAudioUrl);
      if (!audioResponse.ok) {
        error(400, `Failed to fetch audio from URL: ${audioResponse.status}`);
      }

      audioBuffer = await audioResponse.arrayBuffer();
      const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
      ext = contentType.includes('wav')
        ? 'wav'
        : contentType.includes('ogg')
          ? 'ogg'
          : contentType.includes('webm')
            ? 'webm'
            : 'mp3';
    }

    const audioFile = new File([audioBuffer], `audio.${ext}`, { type: 'audio/mpeg' });

    // Transcribe with OpenAI Whisper with word-level timestamps
    const openai = new OpenAI({ apiKey });
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
      ...(language ? { language } : {}),
      ...(prompt ? { prompt } : {})
    });

    // Extract both word-level and segment-level data
    const words = transcription.words || [];

    if (words.length === 0) {
      return json({
        success: true,
        words: [],
        language: language || transcription.language || 'en'
      });
    }

    // Format word-level data (single source of truth)
    const wordData = words.map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end
    }));

    return json({
      success: true,
      words: wordData,
      language: language || transcription.language || 'en'
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Caption generation error:', err);
    error(
      500,
      `Failed to generate captions: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
};
