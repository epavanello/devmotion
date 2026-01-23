/**
 * Video capture utility using Element Capture API
 * @see https://developer.chrome.com/docs/web-platform/element-capture
 */

// Type definitions for Element Capture and Region Capture APIs
declare global {
  interface RestrictionTarget {}
  var RestrictionTarget: {
    fromElement(element: Element): Promise<RestrictionTarget>;
  };
  interface CropTarget {}
  var CropTarget: {
    fromElement(element: Element): Promise<CropTarget>;
  };
}

export interface VideoExportOptions {
  width: number;
  height: number;
  fps: number;
  duration: number;
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
    const hasRestrictionTarget = 'RestrictionTarget' in self;
    const hasElementCapture = hasRestrictionTarget && 'fromElement' in RestrictionTarget;
    const hasCropTarget = 'CropTarget' in self;
    const hasRegionCapture = hasCropTarget && 'fromElement' in CropTarget;
    const hasMediaDevices = 'mediaDevices' in navigator;
    const hasGetDisplayMedia = hasMediaDevices && 'getDisplayMedia' in navigator.mediaDevices;
    const hasDisplayMedia = hasMediaDevices && hasGetDisplayMedia;

    const supported = (hasElementCapture || hasRegionCapture) && hasDisplayMedia;

    console.log('[VideoCapture] Support check:', {
      hasRestrictionTarget,
      hasElementCapture,
      hasCropTarget,
      hasRegionCapture,
      hasMediaDevices,
      hasGetDisplayMedia,
      supported
    });

    return supported;
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
      console.log('[VideoCapture] Starting capture process...');
      console.log('[VideoCapture] Target element:', element);
      console.log('[VideoCapture] Element dimensions:', {
        width: element.offsetWidth,
        height: element.offsetHeight,
        visible: element.offsetParent !== null
      });

      // Step 1: Request display media with preferCurrentTab
      console.log('[VideoCapture] Requesting display media...');
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: options.width },
          height: { ideal: options.height },
          frameRate: { ideal: options.fps }
        } as MediaTrackConstraints,
        audio: false,
        preferCurrentTab: true
      } as any);

      console.log('[VideoCapture] Display media obtained');

      const [videoTrack] = this.mediaStream.getVideoTracks();
      if (!videoTrack) {
        throw new Error('No video track available');
      }

      const settings = videoTrack.getSettings();
      console.log('[VideoCapture] Video track:', {
        label: videoTrack.label,
        enabled: videoTrack.enabled,
        muted: videoTrack.muted,
        readyState: videoTrack.readyState,
        settings
      });

      // Check if user selected the current tab
      const displaySurface = settings.displaySurface;
      console.log('[VideoCapture] Display surface:', displaySurface);

      if (!displaySurface || displaySurface !== 'browser') {
        throw new Error(
          `Wrong tab selected! You selected "${displaySurface || 'unknown'}" but capture requires "This tab" (browser). Please try again and select "This tab" from the browser dialog.`
        );
      }

      // Step 2: Try Element Capture first, then Region Capture as fallback
      let captureMethod = 'none';
      let hasValidFrames = false;

      // Try Element Capture first (better for removing occluding content)
      if ('RestrictionTarget' in self && 'fromElement' in RestrictionTarget) {
        try {
          console.log('[VideoCapture] Trying Element Capture (RestrictionTarget)...');
          const RestrictionTargetClass = (self as any).RestrictionTarget;
          const restrictionTarget = await RestrictionTargetClass.fromElement(element);
          await (videoTrack as any).restrictTo(restrictionTarget);
          console.log('[VideoCapture] Element Capture applied successfully');

          // Wait for restriction to take effect
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Test if frames are valid
          hasValidFrames = await this.testVideoTrack(this.mediaStream);
          if (hasValidFrames) {
            captureMethod = 'element';
            console.log('[VideoCapture] Element Capture working correctly!');
          } else {
            console.warn(
              '[VideoCapture] Element Capture produced empty frames, trying Region Capture...'
            );
          }
        } catch (error) {
          console.warn('[VideoCapture] Element Capture failed:', error);
        }
      }

      // If Element Capture didn't work, try Region Capture
      if (!hasValidFrames && 'CropTarget' in self && 'fromElement' in CropTarget) {
        try {
          console.log('[VideoCapture] Trying Region Capture (CropTarget)...');
          const CropTargetClass = (self as any).CropTarget;
          const cropTarget = await CropTargetClass.fromElement(element);
          await (videoTrack as any).cropTo(cropTarget);
          console.log('[VideoCapture] Region Capture applied successfully');

          // Wait for crop to take effect
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Test if frames are valid
          hasValidFrames = await this.testVideoTrack(this.mediaStream);
          if (hasValidFrames) {
            captureMethod = 'region';
            console.log('[VideoCapture] Region Capture working correctly!');
          } else {
            console.error('[VideoCapture] Region Capture also produced empty frames');
          }
        } catch (error) {
          console.error('[VideoCapture] Region Capture failed:', error);
        }
      }

      if (!hasValidFrames) {
        throw new Error(
          'Both Element Capture and Region Capture failed to produce valid frames. The element may have complex 3D transforms that prevent capture. Try simplifying the element structure or removing 3D transforms.'
        );
      }

      console.log('[VideoCapture] Using capture method:', captureMethod);

      // Step 4: Setup MediaRecorder
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
        console.log('[VideoCapture] Data available:', {
          size: event.data?.size,
          type: event.data?.type
        });
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          console.log('[VideoCapture] Chunk added. Total chunks:', this.recordedChunks.length);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('[VideoCapture] Recording stopped. Total chunks:', this.recordedChunks.length);
        const blob = new Blob(this.recordedChunks, { type: selectedMimeType });
        console.log('[VideoCapture] Final blob:', {
          size: blob.size,
          type: blob.type
        });
        options.onComplete?.(blob);
        this.cleanup();
      };

      this.mediaRecorder.onerror = () => {
        console.error('[VideoCapture] MediaRecorder error');
        const error = new Error('MediaRecorder error');
        options.onError?.(error);
        this.cleanup();
      };

      this.mediaRecorder.onstart = () => {
        console.log('[VideoCapture] MediaRecorder started');
      };

      // Start recording
      this.startTime = Date.now();
      console.log('[VideoCapture] Starting MediaRecorder...');
      this.mediaRecorder.start(100); // Capture in 100ms chunks

      // Wait a moment and check state
      await new Promise((resolve) => setTimeout(resolve, 100));
      console.log('[VideoCapture] MediaRecorder state:', this.mediaRecorder.state);

      // Track progress
      if (options.onProgress) {
        this.trackProgress(options.duration * 1000, options.onProgress);
      }

      console.log('[VideoCapture] Video capture started successfully', {
        mimeType: selectedMimeType,
        width: options.width,
        height: options.height,
        fps: options.fps,
        duration: options.duration,
        recorderState: this.mediaRecorder.state
      });
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
    console.log('[VideoCapture] Testing video track for frame production...');

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      const timeout = setTimeout(() => {
        console.warn('[VideoCapture] Video track test timeout');
        video.remove();
        resolve(false);
      }, 3000);

      video.onloadedmetadata = () => {
        console.log('[VideoCapture] Video metadata loaded:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          duration: video.duration
        });

        video
          .play()
          .then(() => {
            // Wait a bit for first frame
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

                  // Check if we got any non-zero pixels (checking RGB, not just alpha)
                  for (let i = 0; i < imageData.data.length; i += 4) {
                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    const a = imageData.data[i + 3];

                    // If any pixel has any color or alpha, we have content
                    if (r > 0 || g > 0 || b > 0 || a > 0) {
                      hasContent = true;
                      break;
                    }
                  }

                  console.log('[VideoCapture] Frame test result:', {
                    canvasSize: `${canvas.width}x${canvas.height}`,
                    hasContent,
                    samplePixels: Array.from(imageData.data.slice(0, 20))
                  });
                } catch (error) {
                  console.error('[VideoCapture] Error testing frame:', error);
                }
              }

              clearTimeout(timeout);
              video.remove();
              canvas.remove();
              resolve(hasContent);
            }, 500);
          })
          .catch((error) => {
            console.error('[VideoCapture] Video play error:', error);
            clearTimeout(timeout);
            video.remove();
            resolve(false);
          });
      };

      video.onerror = (error) => {
        clearTimeout(timeout);
        video.remove();
        console.error('[VideoCapture] Video element error:', error);
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
