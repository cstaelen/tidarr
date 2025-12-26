import { JsonDB, Config } from "node-json-db";
import path from "path";

import { CONFIG_PATH } from "../../constants";

// Database for tracking completed tracks in playlists
const playlistProgressDbPath = path.join(CONFIG_PATH, "playlist_progress");
export const playlistProgressDb = new JsonDB(
  new Config(playlistProgressDbPath, true, false, "/"),
);

const PROGRESS_PATH = "/";

export type PlaylistProgress = {
  playlistId: string;
  totalTracks: number;
  completedTracks: string[]; // Array of track filenames or identifiers
  lastUpdated: string;
};

/**
 * Get all playlist progress records
 */
export async function getAllPlaylistProgress(): Promise<
  Record<string, PlaylistProgress>
> {
  try {
    const data = await playlistProgressDb.getData(PROGRESS_PATH);
    return data || {};
  } catch {
    await playlistProgressDb.push(PROGRESS_PATH, {});
    return {};
  }
}

/**
 * Get progress for a specific playlist
 */
export async function getPlaylistProgress(
  playlistId: string,
): Promise<PlaylistProgress | null> {
  try {
    const allProgress = await getAllPlaylistProgress();
    return allProgress[playlistId] || null;
  } catch {
    return null;
  }
}

/**
 * Mark a track as completed for a playlist
 */
export async function markTrackCompleted(
  playlistId: string,
  trackIdentifier: string,
  totalTracks?: number,
): Promise<void> {
  const allProgress = await getAllPlaylistProgress();

  if (!allProgress[playlistId]) {
    allProgress[playlistId] = {
      playlistId,
      totalTracks: totalTracks || 0,
      completedTracks: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  const progress = allProgress[playlistId];

  // Add track if not already completed
  if (!progress.completedTracks.includes(trackIdentifier)) {
    progress.completedTracks.push(trackIdentifier);
  }

  // Update total if provided
  if (totalTracks) {
    progress.totalTracks = totalTracks;
  }

  progress.lastUpdated = new Date().toISOString();

  await playlistProgressDb.push(PROGRESS_PATH, allProgress);

  console.log(
    `✅ [PLAYLIST PROGRESS] Marked track completed: ${trackIdentifier} (${progress.completedTracks.length}/${progress.totalTracks})`,
  );
}

/**
 * Check if a track is already completed
 */
export async function isTrackCompleted(
  playlistId: string,
  trackIdentifier: string,
): Promise<boolean> {
  const progress = await getPlaylistProgress(playlistId);
  if (!progress) return false;
  return progress.completedTracks.includes(trackIdentifier);
}

/**
 * Get count of completed tracks
 */
export async function getCompletedTrackCount(
  playlistId: string,
): Promise<number> {
  const progress = await getPlaylistProgress(playlistId);
  return progress ? progress.completedTracks.length : 0;
}

/**
 * Clear progress for a playlist (when finished or removed)
 */
export async function clearPlaylistProgress(
  playlistId: string,
): Promise<void> {
  const allProgress = await getAllPlaylistProgress();
  delete allProgress[playlistId];
  await playlistProgressDb.push(PROGRESS_PATH, allProgress);
  console.log(`🧹 [PLAYLIST PROGRESS] Cleared progress for: ${playlistId}`);
}

/**
 * Clean up old progress records (older than 30 days)
 */
export async function cleanupOldProgress(): Promise<void> {
  const allProgress = await getAllPlaylistProgress();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let cleaned = 0;
  for (const [playlistId, progress] of Object.entries(allProgress)) {
    const lastUpdated = new Date(progress.lastUpdated);
    if (lastUpdated < thirtyDaysAgo) {
      delete allProgress[playlistId];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    await playlistProgressDb.push(PROGRESS_PATH, allProgress);
    console.log(
      `🧹 [PLAYLIST PROGRESS] Cleaned up ${cleaned} old progress records`,
    );
  }
}

/**
 * Get summary of progress for a playlist
 */
export async function getProgressSummary(playlistId: string): Promise<{
  completed: number;
  total: number;
  percentage: number;
  remaining: number;
}> {
  const progress = await getPlaylistProgress(playlistId);

  if (!progress) {
    return { completed: 0, total: 0, percentage: 0, remaining: 0 };
  }

  const completed = progress.completedTracks.length;
  const total = progress.totalTracks;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = Math.max(0, total - completed);

  return { completed, total, percentage, remaining };
}
