import { supabase } from '../lib/supabase';
import { GEMINI_API_KEY } from '../config/geminiApiKey';

export interface QuestionAttempt {
  id?: string;
  user_id: string;
  question_id: string;
  question_text: string;
  question_type: 'diagnostic' | 'quiz' | 'practice';
  chapter_id?: string;
  topic?: string;
  concept?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  time_taken_seconds: number;
  hints_used: number;
  attempts_count: number;
  confidence_level: number;
  session_id?: string;
}

export interface StudySession {
  id?: string;
  user_id: string;
  session_type: 'study' | 'quiz' | 'diagnostic' | 'practice';
  chapter_id?: string;
  topic?: string;
  started_at: string;
  ended_at?: string;
  duration_minutes: number;
  questions_attempted: number;
  questions_correct: number;
  concepts_covered: string[];
  session_data: any;
}

export interface ChapterDiagnostic {
  id?: string;
  user_id: string;
  chapter_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  time_taken_minutes: number;
  strengths: string[];
  weaknesses: string[];
  knowledge_gaps: string[];
  prerequisite_concepts: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  raw_responses: any;
}

export interface AIRecommendation {
  id?: string;
  user_id: string;
  recommendation_type: 'weakness_fix' | 'concept_review' | 'practice_suggestion';
  chapter_id?: string;
  concept?: string;
  weakness_area?: string;
  recommendation_text: string;
  study_materials: any;
  practice_questions: any;
  estimated_time_minutes: number;
  priority_level: number;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
}

export interface ConceptMastery {
  id?: string;
  user_id: string;
  chapter_id: string;
  concept: string;
  mastery_level: number;
  attempts_count: number;
  correct_attempts: number;
  last_practiced_at?: string;
  time_to_master_minutes: number;
  difficulty_progression: string[];
}

export interface ProgressReport {
  id?: string;
  user_id: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'chapter';
  report_period_start: string;
  report_period_end: string;
  chapter_id?: string;
  overall_progress: number;
  strengths_identified: string[];
  areas_for_improvement: string[];
  time_spent_minutes: number;
  questions_attempted: number;
  accuracy_percentage: number;
  concepts_mastered: string[];
  ai_insights: string;
  recommendations: string[];
  report_data: any;
}

export class ProgressTrackingService {
  // Track every question attempt
  static async recordQuestionAttempt(attempt: QuestionAttempt): Promise<void> {
    try {
      const { error } = await supabase
        .from('question_attempts')
        .insert(attempt);

      if (error) throw error;

      // Update concept mastery
      if (attempt.concept && attempt.chapter_id) {
        await this.updateConceptMastery(
          attempt.user_id,
          attempt.chapter_id,
          attempt.concept,
          attempt.is_correct,
          attempt.time_taken_seconds
        );
      }
    } catch (error) {
      console.error('Error recording question attempt:', error);
      throw error;
    }
  }

  // Start a study session
  static async startStudySession(session: Omit<StudySession, 'id' | 'ended_at' | 'duration_minutes'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          ...session,
          started_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error starting study session:', error);
      throw error;
    }
  }

  // End a study session
  static async endStudySession(sessionId: string, endData: Partial<StudySession>): Promise<void> {
    try {
      const endTime = new Date().toISOString();
      const { error } = await supabase
        .from('study_sessions')
        .update({
          ...endData,
          ended_at: endTime
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error ending study session:', error);
      throw error;
    }
  }

  // Save chapter diagnostic results
  static async saveChapterDiagnostic(diagnostic: ChapterDiagnostic): Promise<void> {
    try {
      const { error } = await supabase
        .from('chapter_diagnostics')
        .insert(diagnostic);

      if (error) throw error;

      // Generate AI recommendations based on diagnostic
      await this.generateAIRecommendations(diagnostic);

      // Create personalized learning path
      await this.createLearningPath(diagnostic);
    } catch (error) {
      console.error('Error saving chapter diagnostic:', error);
      throw error;
    }
  }

  // Update concept mastery
  static async updateConceptMastery(
    userId: string,
    chapterId: string,
    concept: string,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<void> {
    try {
      // Get existing mastery record
      const { data: existing } = await supabase
        .from('concept_mastery')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)
        .eq('concept', concept)
        .single();

      if (existing) {
        // Update existing record
        const newAttemptsCount = existing.attempts_count + 1;
        const newCorrectAttempts = existing.correct_attempts + (isCorrect ? 1 : 0);
        const newMasteryLevel = Math.min(1.0, newCorrectAttempts / newAttemptsCount);

        const { error } = await supabase
          .from('concept_mastery')
          .update({
            attempts_count: newAttemptsCount,
            correct_attempts: newCorrectAttempts,
            mastery_level: newMasteryLevel,
            last_practiced_at: new Date().toISOString(),
            time_to_master_minutes: existing.time_to_master_minutes + Math.floor(timeSpent / 60)
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('concept_mastery')
          .insert({
            user_id: userId,
            chapter_id: chapterId,
            concept,
            mastery_level: isCorrect ? 1.0 : 0.0,
            attempts_count: 1,
            correct_attempts: isCorrect ? 1 : 0,
            last_practiced_at: new Date().toISOString(),
            time_to_master_minutes: Math.floor(timeSpent / 60)
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating concept mastery:', error);
      throw error;
    }
  }

  // Generate AI recommendations based on diagnostic results
  static async generateAIRecommendations(diagnostic: ChapterDiagnostic): Promise<void> {
    try {
      const prompt = `
        Analyze this student's diagnostic test results and generate specific recommendations:
        
        Chapter: ${diagnostic.chapter_id}
        Score: ${diagnostic.score_percentage}%
        Strengths: ${diagnostic.strengths.join(', ')}
        Weaknesses: ${diagnostic.weaknesses.join(', ')}
        Knowledge Gaps: ${diagnostic.knowledge_gaps.join(', ')}
        
        Generate 3-5 specific recommendations with:
        1. What to study (specific concepts)
        2. How to study (methods and resources)
        3. Practice questions types
        4. Estimated time needed
        5. Priority level (1-5)
        
        Return as JSON array with this structure:
        [
          {
            "type": "weakness_fix",
            "concept": "specific concept",
            "weakness_area": "area name",
            "recommendation": "detailed recommendation",
            "study_materials": {"videos": [], "exercises": [], "explanations": []},
            "practice_questions": {"easy": [], "medium": [], "hard": []},
            "estimated_time": 30,
            "priority": 5
          }
        ]
      `;

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const data = await response.json();
      let recommendations = [];

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        try {
          let text = data.candidates[0].content.parts[0].text.trim();
          text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
          recommendations = JSON.parse(text);
        } catch (parseError) {
          console.error('Error parsing AI recommendations:', parseError);
        }
      }

      // Save recommendations to database
      for (const rec of recommendations) {
        await supabase.from('ai_recommendations').insert({
          user_id: diagnostic.user_id,
          recommendation_type: rec.type,
          chapter_id: diagnostic.chapter_id,
          concept: rec.concept,
          weakness_area: rec.weakness_area,
          recommendation_text: rec.recommendation,
          study_materials: rec.study_materials,
          practice_questions: rec.practice_questions,
          estimated_time_minutes: rec.estimated_time,
          priority_level: rec.priority
        });
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    }
  }

  // Create personalized learning path
  static async createLearningPath(diagnostic: ChapterDiagnostic): Promise<void> {
    try {
      const pathData = {
        diagnostic_results: diagnostic,
        recommended_sequence: this.generateLearningSequence(diagnostic),
        focus_areas: diagnostic.weaknesses,
        prerequisite_review: diagnostic.prerequisite_concepts
      };

      const { error } = await supabase
        .from('learning_paths')
        .upsert({
          user_id: diagnostic.user_id,
          chapter_id: diagnostic.chapter_id,
          path_data: pathData,
          prerequisites: diagnostic.prerequisite_concepts,
          recommended_sequence: pathData.recommended_sequence,
          estimated_completion_days: this.estimateCompletionTime(diagnostic)
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating learning path:', error);
      throw error;
    }
  }

  // Generate learning sequence based on diagnostic
  private static generateLearningSequence(diagnostic: ChapterDiagnostic): string[] {
    const sequence = [];
    
    // Start with prerequisites if there are knowledge gaps
    if (diagnostic.knowledge_gaps.length > 0) {
      sequence.push('Review Prerequisites');
      diagnostic.prerequisite_concepts.forEach(concept => {
        sequence.push(`Master: ${concept}`);
      });
    }

    // Add weakness areas
    diagnostic.weaknesses.forEach(weakness => {
      sequence.push(`Focus on: ${weakness}`);
      sequence.push(`Practice: ${weakness} Problems`);
    });

    // Add main chapter concepts
    sequence.push('Core Chapter Concepts');
    sequence.push('Advanced Applications');
    sequence.push('Chapter Assessment');

    return sequence;
  }

  // Estimate completion time based on diagnostic results
  private static estimateCompletionTime(diagnostic: ChapterDiagnostic): number {
    let baseDays = 7; // Base time for a chapter
    
    // Add extra time for weaknesses
    baseDays += diagnostic.weaknesses.length * 2;
    
    // Add extra time for knowledge gaps
    baseDays += diagnostic.knowledge_gaps.length * 3;
    
    // Adjust based on score
    if (diagnostic.score_percentage < 30) baseDays += 5;
    else if (diagnostic.score_percentage < 60) baseDays += 3;
    
    return Math.min(baseDays, 21); // Cap at 3 weeks
  }

  // Generate comprehensive progress report
  static async generateProgressReport(
    userId: string,
    reportType: 'daily' | 'weekly' | 'monthly' | 'chapter',
    chapterId?: string
  ): Promise<ProgressReport> {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (reportType) {
        case 'daily':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'chapter':
          startDate.setMonth(endDate.getMonth() - 3); // Last 3 months for chapter
          break;
      }

      // Get question attempts data
      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', userId)
        .gte('attempted_at', startDate.toISOString())
        .lte('attempted_at', endDate.toISOString());

      // Get study sessions data
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      // Get concept mastery data
      const { data: mastery } = await supabase
        .from('concept_mastery')
        .select('*')
        .eq('user_id', userId);

      // Calculate metrics
      const totalAttempts = attempts?.length || 0;
      const correctAttempts = attempts?.filter(a => a.is_correct).length || 0;
      const accuracyPercentage = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
      const totalTimeSpent = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

      // Identify strengths and weaknesses
      const conceptStats = this.analyzeConceptPerformance(attempts || []);
      const strengths = Object.entries(conceptStats)
        .filter(([_, stats]: [string, any]) => stats.accuracy > 80)
        .map(([concept, _]) => concept);
      const weaknesses = Object.entries(conceptStats)
        .filter(([_, stats]: [string, any]) => stats.accuracy < 60)
        .map(([concept, _]) => concept);

      // Get mastered concepts
      const masteredConcepts = mastery?.filter(m => m.mastery_level >= 0.8).map(m => m.concept) || [];

      // Generate AI insights
      const aiInsights = await this.generateAIInsights(userId, {
        totalAttempts,
        accuracyPercentage,
        totalTimeSpent,
        strengths,
        weaknesses,
        masteredConcepts,
        recentSessions: sessions || []
      });

      const report: ProgressReport = {
        user_id: userId,
        report_type: reportType,
        report_period_start: startDate.toISOString(),
        report_period_end: endDate.toISOString(),
        chapter_id: chapterId,
        overall_progress: this.calculateOverallProgress(mastery || []),
        strengths_identified: strengths,
        areas_for_improvement: weaknesses,
        time_spent_minutes: totalTimeSpent,
        questions_attempted: totalAttempts,
        accuracy_percentage: accuracyPercentage,
        concepts_mastered: masteredConcepts,
        ai_insights: aiInsights,
        recommendations: await this.generateProgressRecommendations(userId, weaknesses),
        report_data: {
          conceptStats,
          sessionBreakdown: this.analyzeSessionBreakdown(sessions || []),
          difficultyProgression: this.analyzeDifficultyProgression(attempts || [])
        }
      };

      // Save report to database
      const { data, error } = await supabase
        .from('progress_reports')
        .insert(report)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating progress report:', error);
      throw error;
    }
  }

  // Analyze concept performance
  private static analyzeConceptPerformance(attempts: any[]): any {
    const conceptStats: any = {};
    
    attempts.forEach(attempt => {
      if (!attempt.concept) return;
      
      if (!conceptStats[attempt.concept]) {
        conceptStats[attempt.concept] = {
          total: 0,
          correct: 0,
          accuracy: 0,
          avgTime: 0,
          totalTime: 0
        };
      }
      
      conceptStats[attempt.concept].total++;
      if (attempt.is_correct) conceptStats[attempt.concept].correct++;
      conceptStats[attempt.concept].totalTime += attempt.time_taken_seconds;
    });
    
    // Calculate averages
    Object.keys(conceptStats).forEach(concept => {
      const stats = conceptStats[concept];
      stats.accuracy = (stats.correct / stats.total) * 100;
      stats.avgTime = stats.totalTime / stats.total;
    });
    
    return conceptStats;
  }

  // Calculate overall progress
  private static calculateOverallProgress(masteryData: any[]): number {
    if (masteryData.length === 0) return 0;
    
    const totalMastery = masteryData.reduce((sum, m) => sum + m.mastery_level, 0);
    return (totalMastery / masteryData.length) * 100;
  }

  // Analyze session breakdown
  private static analyzeSessionBreakdown(sessions: any[]): any {
    const breakdown = {
      byType: {} as any,
      byDay: {} as any,
      avgDuration: 0
    };
    
    sessions.forEach(session => {
      // By type
      if (!breakdown.byType[session.session_type]) {
        breakdown.byType[session.session_type] = { count: 0, totalTime: 0 };
      }
      breakdown.byType[session.session_type].count++;
      breakdown.byType[session.session_type].totalTime += session.duration_minutes;
      
      // By day
      const day = new Date(session.started_at).toDateString();
      if (!breakdown.byDay[day]) {
        breakdown.byDay[day] = { sessions: 0, totalTime: 0 };
      }
      breakdown.byDay[day].sessions++;
      breakdown.byDay[day].totalTime += session.duration_minutes;
    });
    
    const totalTime = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    breakdown.avgDuration = sessions.length > 0 ? totalTime / sessions.length : 0;
    
    return breakdown;
  }

  // Analyze difficulty progression
  private static analyzeDifficultyProgression(attempts: any[]): any {
    const progression = {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 }
    };
    
    attempts.forEach(attempt => {
      if (progression[attempt.difficulty as keyof typeof progression]) {
        progression[attempt.difficulty as keyof typeof progression].total++;
        if (attempt.is_correct) {
          progression[attempt.difficulty as keyof typeof progression].correct++;
        }
      }
    });
    
    // Calculate accuracy for each difficulty
    Object.keys(progression).forEach(difficulty => {
      const diff = progression[difficulty as keyof typeof progression];
      diff.accuracy = diff.total > 0 ? (diff.correct / diff.total) * 100 : 0;
    });
    
    return progression;
  }

  // Generate AI insights for progress report
  private static async generateAIInsights(userId: string, data: any): Promise<string> {
    try {
      const prompt = `
        Analyze this student's learning progress and provide insights:
        
        Performance Data:
        - Total Questions: ${data.totalAttempts}
        - Accuracy: ${data.accuracyPercentage.toFixed(1)}%
        - Study Time: ${data.totalTimeSpent} minutes
        - Strengths: ${data.strengths.join(', ')}
        - Weaknesses: ${data.weaknesses.join(', ')}
        - Mastered Concepts: ${data.masteredConcepts.join(', ')}
        
        Provide a comprehensive analysis including:
        1. Overall performance assessment
        2. Learning patterns identified
        3. Areas of improvement
        4. Motivational feedback
        5. Next steps recommendations
        
        Write in an encouraging, mentor-like tone. Keep it concise but insightful.
      `;

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const result = await response.json();
      
      if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return result.candidates[0].content.parts[0].text.trim();
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
    
    return `You're making great progress! Keep up the consistent effort and focus on your areas for improvement.`;
  }

  // Generate progress-based recommendations
  private static async generateProgressRecommendations(userId: string, weaknesses: string[]): Promise<string[]> {
    const recommendations = [
      "Continue your daily practice routine - consistency is key! 📚",
      "Great job on maintaining focus during study sessions! 🎯"
    ];
    
    if (weaknesses.length > 0) {
      recommendations.push(`Focus extra attention on ${weaknesses[0]} - you're getting there! 💪`);
      recommendations.push(`Try breaking down ${weaknesses[0]} into smaller concepts for better understanding 🧩`);
    }
    
    return recommendations;
  }

  // Get user's learning analytics
  static async getUserAnalytics(userId: string, chapterId?: string): Promise<any> {
    try {
      const baseQuery = supabase
        .from('question_attempts')
        .select('*')
        .eq('user_id', userId);
      
      if (chapterId) {
        baseQuery.eq('chapter_id', chapterId);
      }
      
      const { data: attempts } = await baseQuery;
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId);
      
      const { data: mastery } = await supabase
        .from('concept_mastery')
        .select('*')
        .eq('user_id', userId);
      
      const { data: recommendations } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('priority_level', { ascending: false });

      return {
        attempts: attempts || [],
        sessions: sessions || [],
        mastery: mastery || [],
        recommendations: recommendations || [],
        analytics: {
          totalQuestions: attempts?.length || 0,
          correctAnswers: attempts?.filter(a => a.is_correct).length || 0,
          accuracy: attempts?.length ? (attempts.filter(a => a.is_correct).length / attempts.length) * 100 : 0,
          totalStudyTime: sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0,
          conceptsMastered: mastery?.filter(m => m.mastery_level >= 0.8).length || 0
        }
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  // Check if user has taken diagnostic for chapter
  static async hasUserTakenDiagnostic(userId: string, chapterId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chapter_diagnostics')
        .select('id')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking diagnostic status:', error);
      return false;
    }
  }

  // Get chapter diagnostic results
  static async getChapterDiagnostic(userId: string, chapterId: string): Promise<ChapterDiagnostic | null> {
    try {
      const { data, error } = await supabase
        .from('chapter_diagnostics')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting chapter diagnostic:', error);
      return null;
    }
  }
}