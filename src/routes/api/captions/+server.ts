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

/** Format seconds as M:SS.d (e.g., 0:03.5, 1:23.0) */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  // One decimal place for the format the parser expects
  const secsStr = secs.toFixed(1).padStart(4, '0');
  return `${mins}:${secsStr}`;
}

/**
 * POST /api/captions
 *
 * Accepts an audio URL and generates timed captions using OpenAI Whisper.
 * The audio is downloaded and sent to Whisper for real speech-to-text transcription.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { audioUrl, language } = body as {
      audioUrl: string;
      language?: string;
    };

    if (!audioUrl) {
      error(400, 'audioUrl is required');
    }

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      error(503, 'AI service not configured (OPENAI_API_KEY missing)');
    }

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      error(400, `Failed to fetch audio from URL: ${audioResponse.status}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
    const ext = contentType.includes('wav')
      ? 'wav'
      : contentType.includes('ogg')
        ? 'ogg'
        : contentType.includes('webm')
          ? 'webm'
          : 'mp3';

    const audioFile = new File([audioBuffer], `audio.${ext}`, { type: contentType });

    // Transcribe with OpenAI Whisper
    const openai = new OpenAI({ apiKey });
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
      ...(language ? { language } : {})
    });

    // Convert Whisper segments to the timed caption format
    const segments = (
      transcription as unknown as { segments: Array<{ start: number; end: number; text: string }> }
    ).segments;

    if (!segments || segments.length === 0) {
      return json({
        success: true,
        captions: '',
        format: 'timed',
        language: language || transcription.language || 'en'
      });
    }

    const captionLines = segments.map(
      (seg) => `${formatTime(seg.start)} - ${formatTime(seg.end)} | ${seg.text.trim()}`
    );

    return json({
      success: true,
      captions: captionLines.join('\n'),
      format: 'timed',
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
