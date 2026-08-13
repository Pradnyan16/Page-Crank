/**
 * media.ts — Autoplay video and audio detector
 *
 * WHY: Autoplay video is one of the most disruptive reader experiences —
 * it consumes bandwidth, hijacks audio, and shifts layout. Detecting it
 * objectively (DOM attributes + runtime play state) gives us a deterministic
 * signal for the Intrusion pillar rather than relying on human observation.
 */

import type { Page } from 'playwright';
import type { MediaResult } from '../types.js';

/**
 * Detects autoplay video and audio on the page.
 * Checks both HTML attributes (autoplay) and runtime play state
 * (HTMLMediaElement.paused === false) to catch JS-initiated autoplays.
 */
export async function detectMedia(page: Page): Promise<MediaResult> {
  const result = await page.evaluate(() => {
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video'));
    const audios = Array.from(document.querySelectorAll<HTMLAudioElement>('audio'));

    // autoplay attribute OR actively playing (JS-initiated autoplay)
    const autoplayVideos = videos.filter(
      (v) => v.hasAttribute('autoplay') || !v.paused,
    );

    const autoplayAudios = audios.filter(
      (a) => a.hasAttribute('autoplay') || !a.paused,
    );

    // A video playing on load is more severe than one that merely has the attribute
    const videoPlayingOnLoad = videos.some((v) => !v.paused && v.currentTime > 0);

    return {
      autoplayVideoDetected: autoplayVideos.length > 0,
      autoplayAudioDetected: autoplayAudios.length > 0,
      videoCount: videos.length,
      videoPlayingOnLoad,
    };
  });

  return result;
}
