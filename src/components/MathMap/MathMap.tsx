import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChapterDiagnosticTest } from './ChapterDiagnosticTest';
import { EnhancedMathMap } from './EnhancedMathMap';
import { ProgressTrackingService, ChapterDiagnostic } from '../../services/progressTrackingService';
import chaptersData from '../../data/chapters.json';

interface MathMapProps {
  setShowNavigation: (show: boolean) => void;
}

export function MathMap({ setShowNavigation }: MathMapProps) {
  const [loadingPersonalized, setLoadingPersonalized] = useState(false);
  const { userProfile } = useAuth();
  const [chapterDiagnostics, setChapterDiagnostics] = useState<{ [key: string]: ChapterDiagnostic }>({});
  const [showChapterDiagnostic, setShowChapterDiagnostic] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);

  useEffect(() => {
    if (userProfile) {
      loadChapterDiagnostics();
    }
  }, [userProfile]);

  const loadChapterDiagnostics = async () => {
    if (!userProfile) return;

    const userChapters = chaptersData.filter(ch => ch.class_level === userProfile.class_level);
    const diagnostics: { [key: string]: ChapterDiagnostic } = {};

    for (const chapter of userChapters) {
      const diagnostic = await ProgressTrackingService.getChapterDiagnostic(userProfile.id, chapter.id);
      if (diagnostic) {
        diagnostics[chapter.id] = diagnostic;
      }
    }

    setChapterDiagnostics(diagnostics);
  };

  const handleChapterClick = async (chapter: any) => {
    if (!userProfile) return;

    // Check if user has taken diagnostic for this chapter
    const hasDiagnostic = await ProgressTrackingService.hasUserTakenDiagnostic(userProfile.id, chapter.id);
    
    if (!hasDiagnostic) {
      setSelectedChapter(chapter);
      setShowChapterDiagnostic(chapter.id);
    } else {
      // Navigate to chapter content or show chapter details
      console.log('Navigate to chapter:', chapter.chapter);
    }
  };

  const handleDiagnosticComplete = async (diagnostic: ChapterDiagnostic) => {
    setLoadingPersonalized(true);
    setChapterDiagnostics(prev => ({
      ...prev,
      [diagnostic.chapter_id]: diagnostic
    }));
  // ...existing code...
    // You can add more async calls here if needed (e.g., content generation)
    setLoadingPersonalized(false);
    setShowChapterDiagnostic(null);
    setSelectedChapter(null);
  if (loadingPersonalized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 text-center max-w-lg mx-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
            <span className="text-4xl text-white">🧠</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Creating Your Personalized Study Materials...</h2>
          <p className="text-gray-300">Please wait while we generate your custom learning journey.</p>
        </div>
      </div>
    );
  }
  };

  const handleSkipDiagnostic = () => {
    setShowChapterDiagnostic(null);
    setSelectedChapter(null);
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="text-3xl mb-4">Please log in to access your Math Map</div>
        </div>
      </div>
    );
  }

  if (showChapterDiagnostic && selectedChapter) {
    return (
      <ChapterDiagnosticTest
        chapterId={selectedChapter.id}
        chapterName={selectedChapter.chapter}
        onComplete={handleDiagnosticComplete}
        onSkip={handleSkipDiagnostic}
      />
    );
  }

  return (
    <EnhancedMathMap 
      chapterDiagnostics={chapterDiagnostics}
      onChapterClick={handleChapterClick}
      setShowNavigation={setShowNavigation}
    />
  );
}