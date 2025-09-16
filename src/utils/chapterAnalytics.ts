// Utility to get per-chapter analytics for a user
import { ProgressTrackingService } from '../../services/progressTrackingService';

export async function getAllChaptersAnalytics(userId, chapters) {
  const analyticsByChapter = {};
  for (const chapter of chapters) {
    const analytics = await ProgressTrackingService.getUserAnalytics(userId, chapter.id);
    analyticsByChapter[chapter.id] = analytics.analytics;
  }
  return analyticsByChapter;
}
