/**
 * Video capture utility using Element Capture API
 * @see https://developer.chrome.com/docs/web-platform/element-capture
 */

// Type definitions for Element Capture and Region Capture APIs
declare global {
  type RestrictionTarget = object;

  var RestrictionTarget: {
    fromElement(element: Element): Promise<RestrictionTarget>;
  };

  type CropTarget = object;

  var CropTarget: {
    fromElement(element: Element): Promise<CropTarget>;
  };

  interface MediaStreamTrack {
    restrictTo(target: RestrictionTarget | null): Promise<void>;
    cropTo(target: CropTarget | null): Promise<void>;
  }

  interface DisplayMediaStreamOptions extends MediaStreamConstraints {
    preferCurrentTab?: boolean;
  }

  interface MediaDevices {
    getDisplayMedia(constraints?: DisplayMediaStreamOptions): Promise<MediaStream>;
  }
}

export interface VideoExportOptions {
  width: number;
  height: number;
  fps: number;
  duration: number;
  onReadyToRecord?: () => void;
  onProgress?: (progress: number) => void;
  onComplete?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export class VideoCapture {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;

  /**
   * Check if Element Capture or Region Capture API is supported
   */
  static isSupported(): boolean {
    const hasElementCapture = 'RestrictionTarget' in self && 'fromElement' in RestrictionTarget;
    const hasRegionCapture = 'CropTarget' in self && 'fromElement' in CropTarget;
    const hasDisplayMedia =
      'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices;

    return (hasElementCapture || hasRegionCapture) && hasDisplayMedia;
  }

  /**
   * Start capturing video from a specific element
   * @param element The HTML element to capture
   * @param options Export options
   */
  async startCapture(element: HTMLElement, options: VideoExportOptions): Promise<void> {
    if (!VideoCapture.isSupported()) {
      throw new Error(
        'Element Capture and Region Capture APIs are not supported in this browser. Please use Chrome 104+ on desktop.'
      );
    }

    try {
      // Request display media with preferCurrentTab
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: options.width },
          height: { ideal: options.height },
          frameRate: { ideal: options.fps }
        },
        audio: false,
        preferCurrentTab: true
      });

      const [videoTrack] = this.mediaStream.getVideoTracks();
      if (!videoTrack) {
        throw new Error('No video track available');
      }

      // Check if user selected the current tab
      const settings = videoTrack.getSettings();
      const displaySurface = settings.displaySurface;

      if (!displaySurface || displaySurface !== 'browser') {
        throw new Error(
          `Wrong tab selected! You selected "${displaySurface || 'unknown'}" but capture requires "This tab" (browser). Please try again and select "This tab" from the browser dialog.`
        );
      }

      let hasValidFrames = false;

      // Try Element Capture first (better for removing occluding content)
      if ('RestrictionTarget' in self && 'fromElement' in RestrictionTarget) {
        try {
          const restrictionTarget = await RestrictionTarget.fromElement(element);
          await videoTrack.restrictTo(restrictionTarget);
          await new Promise((resolve) => setTimeout(resolve, 500));
          hasValidFrames = await this.testVideoTrack(this.mediaStream);
        } catch {
          // Element Capture failed, will try Region Capture
        }
      }

      // If Element Capture didn't work, try Region Capture as fallback
      if (!hasValidFrames && 'CropTarget' in self && 'fromElement' in CropTarget) {
        try {
          const cropTarget = await CropTarget.fromElement(element);
          await videoTrack.cropTo(cropTarget);
          await new Promise((resolve) => setTimeout(resolve, 500));
          hasValidFrames = await this.testVideoTrack(this.mediaStream);
        } catch {
          // Region Capture also failed
        }
      }

      if (!hasValidFrames) {
        throw new Error(
          'Both Element Capture and Region Capture failed to produce valid frames. The element may have complex 3D transforms that prevent capture. Try simplifying the element structure or removing 3D transforms.'
        );
      }

      // Setup MediaRecorder
      this.recordedChunks = [];

      // Try different codecs in order of preference
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No supported video codec found');
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: this.getVideoBitrate(options.width, options.height)
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: selectedMimeType });
        options.onComplete?.(blob);
        this.cleanup();
      };

      this.mediaRecorder.onerror = () => {
        const error = new Error('MediaRecorder error');
        options.onError?.(error);
        this.cleanup();
      };

      // Start recording immediately
      this.startTime = Date.now();
      this.mediaRecorder.start(100);

      // Wait for recording to actually start
      await new Promise((resolve) => {
        if (this.mediaRecorder) {
          this.mediaRecorder.onstart = () => {
            resolve(undefined);
          };
        }
      });

      // Notify that we're ready to start playback
      options.onReadyToRecord?.();

      // Track progress
      if (options.onProgress) {
        this.trackProgress(options.duration * 1000, options.onProgress);
      }
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  /**
   * Test if the video track is producing frames with content
   * @returns true if frames have content, false if empty
   */
  private async testVideoTrack(stream: MediaStream): Promise<boolean> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      const timeout = setTimeout(() => {
        video.remove();
        resolve(false);
      }, 3000);

      video.onloadedmetadata = () => {
        video
          .play()
          .then(() => {
            setTimeout(() => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth || 100;
              canvas.height = video.videoHeight || 100;
              const ctx = canvas.getContext('2d');

              let hasContent = false;

              if (ctx) {
                try {
                  ctx.drawImage(video, 0, 0);
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                  // Check if we got any non-zero pixels
                  for (let i = 0; i < imageData.data.length; i += 4) {
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    const a = imageData.data[i + 3];

                    if (r > 0 || g > 0 || b > 0 || a > 0) {
                      hasContent = true;
                      break;
                    }
                  }
                } catch {
                  // Error testing frame
                }
              }

              clearTimeout(timeout);
              video.remove();
              canvas.remove();
              resolve(hasContent);
            }, 500);
          })
          .catch(() => {
            clearTimeout(timeout);
            video.remove();
            resolve(false);
          });
      };

      video.onerror = () => {
        clearTimeout(timeout);
        video.remove();
        resolve(false);
      };
    });
  }

  /**
   * Stop the recording
   */
  stopCapture(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Track recording progress
   */
  private trackProgress(durationMs: number, onProgress: (progress: number) => void): void {
    const interval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const progress = Math.min((elapsed / durationMs) * 100, 100);
      onProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 100);
  }

  /**
   * Calculate video bitrate based on resolution
   */
  private getVideoBitrate(width: number, height: number): number {
    // Base calculation: ~0.1 bits per pixel at 30fps
    const pixels = width * height;
    const baseBitrate = pixels * 0.1 * 30;

    // Clamp between 2.5 Mbps and 20 Mbps
    return Math.max(2_500_000, Math.min(20_000_000, baseBitrate));
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
  }

  /**
   * Download the recorded video
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
