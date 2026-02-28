/**
 * Timeline-driven element transition utility.
 *
 * Tracks a string value over time, detects the delta (new characters or words),
 * records when each fragment appeared, and computes per-fragment transition
 * progress based on `currentTime` (not wall-clock time).
 *
 * Works with server-side frame-by-frame rendering.
 *
 * Usage inside a component:
 *   const transition = new ElementTransition({ duration: 0.3, effects: ['fade', 'scale'], easing: 'ease-out-cubic' });
 *   watch(() => [content, currentTime], ([content, currentTime]) => {
 *     transition.update(content, currentTime);
 *   });
 *   // then in template: transition.fragments, transition.getStyle(i)
 */

import { SvelteMap } from 'svelte/reactivity';
import { getEasingFunction } from '$lib/engine/interpolation';
import type { ContinuousInterpolationStrategy } from '$lib/schemas/animation';

export type TransitionEffect = 'fade' | 'scale' | 'slide-up';

export interface TransitionConfig {
  /** Duration in milliseconds for the enter transition (default 300) */
  duration?: number;
  /** Which effects to apply (default ['fade']) */
  effects?: TransitionEffect[];
  /** Easing curve for the transition (default 'ease-out') */
  easing?: ContinuousInterpolationStrategy;
  /** Scale start value when using 'scale' effect (default 0) */
  scaleFrom?: number;
  /** Slide distance in px when using 'slide-up' effect (default 8) */
  slideDistance?: number;
}

export interface TransitionFragment {
  text: string;
  /** Eased progress (may overshoot beyond 1 for elastic/back easings) */
  progress: number;
  /** Linear 0-1 clamped progress (before easing) */
  linearProgress: number;
}

const DEFAULTS = {
  duration: 300,
  effects: ['fade'] as TransitionEffect[],
  easing: 'ease-out' as ContinuousInterpolationStrategy,
  scaleFrom: 0,
  slideDistance: 8
} as const;

export class ElementTransition {
  /** Current fragments with their transition progress */
  fragments: TransitionFragment[] = $state([]);

  config: Required<TransitionConfig>;
  /** Maps fragment index → currentTime when it first appeared */
  private appearedAt: SvelteMap<number, number> = new SvelteMap();
  private prevValue = '';
  /** Track if this is the very first update (to skip initial transition) */
  private isFirstUpdate = true;

  constructor(config: TransitionConfig = {}) {
    this.config = $derived({
      duration: config.duration ?? DEFAULTS.duration,
      effects: config.effects ?? DEFAULTS.effects,
      easing: config.easing ?? DEFAULTS.easing,
      scaleFrom: config.scaleFrom ?? DEFAULTS.scaleFrom,
      slideDistance: config.slideDistance ?? DEFAULTS.slideDistance
    });
  }

  /**
   * Call this every frame (from watch callback) with the current string value
   * and the timeline's currentTime.
   *
   * Detects what changed (the delta) and tracks appearance times.
   */
  update(value: string, currentTime: number): void {
    const prev = this.prevValue;

    // If value hasn't changed, just update progress for ongoing transitions
    if (prev === value && !this.isFirstUpdate) {
      this.rebuildFragments(value, currentTime);
      return;
    }

    this.prevValue = value;

    // On first update, mark all content as "already present" (no transition)
    if (this.isFirstUpdate) {
      this.isFirstUpdate = false;
      // Don't set appearedAt for initial content - it will get progress=1
      // Build fragments with progress=1 for all initial content
      this.fragments = value ? [{ text: value, progress: 1, linearProgress: 1 }] : [];
      return;
    }

    // Detect the common prefix length to figure out the granularity of change
    const commonLen = commonPrefixLength(prev, value);

    // If the value shrunk (scrubbing backward), reset tracking for removed content
    if (value.length < prev.length || commonLen < prev.length) {
      // Remove tracking for fragments beyond current value
      for (const [idx] of this.appearedAt) {
        if (idx >= value.length) {
          this.appearedAt.delete(idx);
        }
      }
    }

    // Track appearance time for each character position in the new suffix
    for (let i = commonLen; i < value.length; i++) {
      if (!this.appearedAt.has(i)) {
        this.appearedAt.set(i, currentTime);
      }
    }

    this.rebuildFragments(value, currentTime);
  }

  /**
   * Rebuild fragments array based on current value and time
   */
  private rebuildFragments(value: string, currentTime: number): void {
    const frags: TransitionFragment[] = [];
    const easingFn = getEasingFunction(this.config.easing);
    let i = 0;

    while (i < value.length) {
      const appearedAt = this.appearedAt.get(i);

      // Find run of characters with the same appearedAt
      let j = i + 1;
      while (j < value.length && this.appearedAt.get(j) === appearedAt) {
        j++;
      }

      const text = value.substring(i, j);
      let progress: number;
      let linearProgress: number;

      if (appearedAt === undefined) {
        // Was present before any tracking — fully transitioned
        progress = 1;
        linearProgress = 1;
      } else {
        const elapsed = currentTime - appearedAt;
        const durationSec = this.config.duration / 1000;
        linearProgress = durationSec > 0 ? Math.min(1, Math.max(0, elapsed / durationSec)) : 1;
        // Apply easing curve (may overshoot beyond 1)
        progress = easingFn(linearProgress);
      }

      frags.push({ text, progress, linearProgress });
      i = j;
    }

    this.fragments = frags;
  }

  /** Whether any fragment is currently mid-transition */
  get isAnimating(): boolean {
    return this.fragments.some((f) => f.progress < 1);
  }

  /** Get computed opacity for a fragment */
  getOpacity(fragment: TransitionFragment): number {
    if (!this.config.effects.includes('fade')) return 1;
    return fragment.progress;
  }

  /** Get computed scale for a fragment */
  getScale(fragment: TransitionFragment): number {
    if (!this.config.effects.includes('scale')) return 1;
    const from = this.config.scaleFrom;
    return from + (1 - from) * fragment.progress;
  }

  /** Get computed translateY in px for a fragment */
  getTranslateY(fragment: TransitionFragment): number {
    if (!this.config.effects.includes('slide-up')) return 0;
    return this.config.slideDistance * (1 - fragment.progress);
  }

  /** Get a combined inline style string for a fragment */
  getStyle(fragment: TransitionFragment): string {
    // Use linearProgress to determine completion, not progress (which can overshoot)
    if (fragment.linearProgress >= 1) return '';

    const parts: string[] = [];
    const transforms: string[] = [];
    const hasSmeEffects = this.config.effects.length > 0;

    const opacity = this.getOpacity(fragment);
    if (opacity < 1) parts.push(`opacity:${opacity.toFixed(3)}`);

    const scale = this.getScale(fragment);
    if (scale !== 1) transforms.push(`scale(${scale.toFixed(3)})`);

    const ty = this.getTranslateY(fragment);
    if (ty !== 0) transforms.push(`translateY(${ty.toFixed(1)}px)`);

    if (transforms.length > 0) {
      parts.push(`transform:${transforms.join(' ')}`);
    }

    if (hasSmeEffects) {
      parts.push(`width:calc-size(auto, size * ${fragment.progress.toFixed(3)})`);
    }

    return parts.join(';');
  }

  /** Reset all tracking state */
  reset(): void {
    this.fragments = [];
    this.appearedAt.clear();
    this.prevValue = '';
    this.isFirstUpdate = true;
  }

  /**
   * Compute progress (0-1) from known timing data.
   * Useful when the caller already knows when an element appeared (e.g. CaptionsLayer).
   */
  progressFromTime(currentTime: number, appearedAt: number): number {
    const elapsed = currentTime - appearedAt;
    const durationSec = this.config.duration / 1000;
    const linearProgress = durationSec > 0 ? Math.min(1, Math.max(0, elapsed / durationSec)) : 1;
    const easingFn = getEasingFunction(this.config.easing);
    return easingFn(linearProgress);
  }

  /**
   * Build a TransitionFragment from known timing, for use with getStyle/getOpacity/getScale.
   */
  fragmentFromTime(text: string, currentTime: number, appearedAt: number): TransitionFragment {
    const elapsed = currentTime - appearedAt;
    const durationSec = this.config.duration / 1000;
    const linearProgress = durationSec > 0 ? Math.min(1, Math.max(0, elapsed / durationSec)) : 1;
    const easingFn = getEasingFunction(this.config.easing);
    const progress = easingFn(linearProgress);
    return { text, progress, linearProgress };
  }
}

/** Find the length of the common prefix between two strings */
function commonPrefixLength(a: string, b: string): number {
  const len = Math.min(a.length, b.length);
  let i = 0;
  while (i < len && a[i] === b[i]) i++;
  return i;
}
