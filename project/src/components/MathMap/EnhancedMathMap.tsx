import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Lock, Star, Clock, Target, BookOpen, Sparkles, Trophy, Zap, Crown, ArrowRight, Brain, TrendingUp } from 'lucide-react';
import chaptersData from '../../data/chapters.json';
import { ChapterDiagnostic, ProgressTrackingService } from '../../services/progressTrackingService';
import { generatePersonalizedStudyPlan, generateChapterExplanation } from '../../services/studyPlanService';

interface EnhancedMathMapProps {
  chapterDiagnostics: { [key: string]: ChapterDiagnostic };
  onChapterClick: (chapter: any) => void;
}

export function EnhancedMathMap({ chapterDiagnostics, onChapterClick }: EnhancedMathMapProps) {
  const { userProfile, updateUserProfile } = useAuth();
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [studyPlans, setStudyPlans] = useState<{ [key: string]: any }>({});
  const [explanations, setExplanations] = useState<{ [key: string]: string }>({});
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      loadUserAnalytics();
    }
  }, [userProfile]);

  const loadUserAnalytics = async () => {
    if (!userProfile) return;

    try {
      const analytics = await ProgressTrackingService.getUserAnalytics(userProfile.id);
      setUserAnalytics(analytics);
    } catch (error) {
      console.error('Error loading user analytics:', error);
    }
  };

  if (!userProfile) return null;

  const classChapters = chaptersData.filter((item) => item.class_level === userProfile.class_level);
  const sortedChapters = [...classChapters].sort((a: any, b: any) => {
    const getOrder = (ch: any) => ch.order || 0;
    return getOrder(a) - getOrder(b);
  });

  const unlockedChapters = userProfile.unlocked_chapters || [sortedChapters[0]?.id];
  const isUnlocked = (chapterId: string) => unlockedChapters.includes(chapterId);

  const getChapterStatus = (chapter: any, index: number) => {
    const diagnostic = chapterDiagnostics[chapter.id];
    
    if (diagnostic) {
      if (diagnostic.score_percentage >= 80) {
        return 'completed';
      }
      return 'in_progress';
    }
    
    if (isUnlocked(chapter.id)) {
      return 'unlocked';
    }
    
    // Check if prerequisites are met
    if (index === 0) return 'available';
    
    const previousChapter = sortedChapters[index - 1];
    const prevDiagnosticProgress = chapterDiagnostics[previousChapter?.id];

    if (prevDiagnosticProgress && prevDiagnosticProgress.score_percentage >= 70) {
      return 'available';
    }
    
    return 'locked';
  };

  const handleUnlock = async (chapterId: string, cost: number) => {
    if (!userProfile || userProfile.money < cost) return;
    
    const newUnlocked = [...unlockedChapters, chapterId];
    await updateUserProfile({
      money: userProfile.money - cost,
      unlocked_chapters: newUnlocked
    });
  };

  const handleChapterDetailClick = async (chapter: any) => {
    setSelectedChapter(chapter.id);
    setLoading(true);
    
    try {
      // Generate study plan if not exists
      const diagnostic = chapterDiagnostics[chapter.id];
      if (!studyPlans[chapter.id] && diagnostic) {
        const studyPlan = await generatePersonalizedStudyPlan(
          chapter.id,
          diagnostic,
          userProfile
        );
        setStudyPlans(prev => ({ ...prev, [chapter.id]: studyPlan }));
      }
      
      // Generate explanation if not exists
      if (!explanations[chapter.id]) {
        const studentLevel = diagnostic && diagnostic.score_percentage >= 70
          ? 'intermediate' 
          : 'beginner';
        
        const explanation = await generateChapterExplanation(
          chapter.id,
          chapter.chapter,
          studentLevel
        );
        setExplanations(prev => ({ ...prev, [chapter.id]: explanation }));
      }
    } catch (error) {
      console.error('Error loading chapter details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChapterIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Trophy className="h-8 w-8 text-yellow-400" />;
      case 'in_progress':
        return <Brain className="h-8 w-8 text-blue-400" />;
      case 'unlocked':
        return <BookOpen className="h-8 w-8 text-blue-400" />;
      case 'available':
        return <Target className="h-8 w-8 text-green-400" />;
      default:
        return <Lock className="h-8 w-8 text-gray-400" />;
    }
  };

  const getChapterColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-yellow-500 to-orange-500';
      case 'in_progress':
        return 'from-blue-500 to-indigo-500';
      case 'unlocked':
        return 'from-blue-500 to-indigo-500';
      case 'available':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 pb-20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              backgroundColor: `rgba(${Math.random() * 100 + 155}, ${Math.random() * 100 + 155}, 255, ${Math.random() * 0.4 + 0.1})`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Crown className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
                Your Math Universe
              </h1>
              <p className="text-purple-200 text-lg">Class {userProfile.class_level} • Personalized Learning Journey</p>
            </div>
          </div>
        </div>

        {/* User Analytics Summary */}
        {userAnalytics && (
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 mb-8 shadow-2xl border border-white/20">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
              <p className="text-white font-semibold text-lg">
                You've solved {userAnalytics.analytics.totalQuestions} questions with {userAnalytics.analytics.accuracy.toFixed(1)}% accuracy! 
                {userAnalytics.analytics.conceptsMastered > 0 && ` Mastered ${userAnalytics.analytics.conceptsMastered} concepts! 🎉`}
              </p>
            </div>
          </div>
        )}

        {/* Overall Progress Dashboard */}
        {userAnalytics && userAnalytics.analytics.totalQuestions > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <h3 className="text-lg font-bold text-white">Overall Performance</h3>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{userAnalytics.analytics.accuracy.toFixed(1)}%</div>
                <div className="text-sm text-green-200">Accuracy Rate</div>
                <div className="text-xs text-gray-400 mt-2">{userAnalytics.analytics.correctAnswers}/{userAnalytics.analytics.totalQuestions} correct</div>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="h-6 w-6 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Study Time</h3>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{Math.floor(userAnalytics.analytics.totalStudyTime / 60)}h</div>
                <div className="text-sm text-blue-200">Total Study Time</div>
                <div className="text-xs text-gray-400 mt-2">{userAnalytics.analytics.totalStudyTime % 60}m additional</div>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Mastery</h3>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">{userAnalytics.analytics.conceptsMastered}</div>
                <div className="text-sm text-yellow-200">Concepts Mastered</div>
                <div className="text-xs text-gray-400 mt-2">Keep learning!</div>
              </div>
            </div>
          </div>
        )}

        {/* Chapter Map */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedChapters.map((chapter, index) => {
              const status = getChapterStatus(chapter, index);
              const isClickable = status !== 'locked';
              const diagnostic = chapterDiagnostics[chapter.id];
              
              return (
                <div
                  key={chapter.id}
                  className={`relative group ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => isClickable && onChapterClick(chapter)}
                >
                  <div className={`bg-black/30 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 transition-all duration-500 ${
                    isClickable ? 'hover:scale-105 hover:shadow-2xl hover:border-white/40' : 'opacity-60'
                  }`}>
                    {/* Chapter Icon */}
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${getChapterColor(status)} flex items-center justify-center mb-6 shadow-xl relative overflow-hidden group-hover:scale-110 transition-transform duration-300`}>
                      {getChapterIcon(status)}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    {/* Chapter Info */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                          Chapter {index + 1}
                        </h3>
                        {status === 'completed' && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-300 mb-3">{chapter.chapter}</h4>
                      
                      {/* Topics Preview */}
                      <div className="space-y-2">
                        {chapter.topics.slice(0, 3).map((topic: string, topicIndex: number) => (
                          <div key={topicIndex} className="text-sm text-gray-400 flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>{topic}</span>
                          </div>
                        ))}
                        {chapter.topics.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{chapter.topics.length - 3} more topics
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                      {status === 'locked' ? (
                        <div className="w-full bg-gray-700 text-gray-400 py-3 rounded-xl text-center font-semibold">
                          <Lock className="h-4 w-4 inline mr-2" />
                          Complete previous chapter
                        </div>
                      ) : status === 'available' && !isUnlocked(chapter.id) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlock(chapter.id, chapter.unlock_cost);
                          }}
                          disabled={userProfile.money < chapter.unlock_cost}
                          className={`w-full py-3 rounded-xl font-semibold transition-all ${
                            userProfile.money >= chapter.unlock_cost
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Unlock for {chapter.unlock_cost} coins
                        </button>
                      ) : (
                        <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl text-center font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2">
                          <span>Explore Chapter</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {diagnostic && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                          <span>Progress</span>
                          <span>{Math.round(diagnostic.score_percentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${diagnostic.score_percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Diagnostic: {diagnostic.correct_answers}/{diagnostic.total_questions} correct
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chapter Detail Modal */}
        {selectedChapter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-black/40 backdrop-blur-2xl rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 border border-white/20 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">
                  {chaptersData.find(c => c.id === selectedChapter)?.chapter}
                </h2>
                <button
                  onClick={() => setSelectedChapter(null)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors hover:scale-110 transform"
                >
                  ×
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-gray-300 text-lg">Loading personalized content...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Diagnostic Results */}
                  {chapterDiagnostics[selectedChapter] && (
                    <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-2xl p-6 border border-green-500/20">
                      <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center space-x-2">
                        <CheckCircle className="h-6 w-6" />
                        <span>Your Diagnostic Results</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{chapterDiagnostics[selectedChapter].score_percentage.toFixed(1)}%</div>
                          <div className="text-sm text-green-200">Overall Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{chapterDiagnostics[selectedChapter].correct_answers}/{chapterDiagnostics[selectedChapter].total_questions}</div>
                          <div className="text-sm text-green-200">Questions Correct</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{chapterDiagnostics[selectedChapter].time_taken_minutes}min</div>
                          <div className="text-sm text-green-200">Time Taken</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-200 mb-2">Strengths:</h4>
                          <div className="space-y-1">
                            {chapterDiagnostics[selectedChapter].strengths.map((strength, index) => (
                              <div key={index} className="text-sm text-green-100 flex items-center space-x-2">
                                <CheckCircle className="h-3 w-3" />
                                <span>{strength}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-yellow-200 mb-2">Areas to Focus:</h4>
                          <div className="space-y-1">
                            {chapterDiagnostics[selectedChapter].weaknesses.map((weakness, index) => (
                              <div key={index} className="text-sm text-yellow-100 flex items-center space-x-2">
                                <Zap className="h-3 w-3" />
                                <span>{weakness}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Study Plan */}
                  {studyPlans[selectedChapter] && (
                    <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-2xl p-6 border border-blue-500/20">
                      <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center space-x-2">
                        <Target className="h-6 w-6" />
                        <span>Your Personalized Study Plan</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-blue-200 mb-3">Prerequisites to Review:</h4>
                          <ul className="space-y-2">
                            {studyPlans[selectedChapter].prerequisites.map((prereq: string, index: number) => (
                              <li key={index} className="text-blue-100 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <span>{prereq}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-blue-200 mb-3">Recommended Practice:</h4>
                          <ul className="space-y-2">
                            {studyPlans[selectedChapter].recommended_practice.map((practice: string, index: number) => (
                              <li key={index} className="text-blue-100 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>{practice}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex items-center justify-between bg-blue-800/20 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-blue-400" />
                          <span className="text-blue-200">Estimated Time: {studyPlans[selectedChapter].estimated_time} minutes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-green-400" />
                          <span className="text-green-200 capitalize">Level: {studyPlans[selectedChapter].difficulty_level}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chapter Explanation */}
                  {explanations[selectedChapter] && (
                    <div className="bg-gradient-to-r from-purple-900/30 to-violet-900/30 rounded-2xl p-6 border border-purple-500/20">
                      <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center space-x-2">
                        <BookOpen className="h-6 w-6" />
                        <span>Interactive Explanation</span>
                      </h3>
                      <div className="text-purple-100 leading-relaxed whitespace-pre-line">
                        {explanations[selectedChapter]}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-lg">
                      Start Learning 🚀
                    </button>
                    <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-lg">
                      Take Practice Quiz 📝
                    </button>
                    <button 
                      onClick={() => handleChapterDetailClick(chaptersData.find(c => c.id === selectedChapter))}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 text-white py-4 rounded-2xl hover:from-purple-700 hover:to-violet-700 transition-all font-semibold text-lg"
                    >
                      View Details 📊
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}