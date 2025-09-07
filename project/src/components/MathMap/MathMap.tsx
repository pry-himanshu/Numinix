
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Lock } from 'lucide-react';
import chaptersData from '../../data/chapters.json';
import { UNSAFE_ErrorResponseImpl } from 'react-router-dom';


export function MathMap() {
  const { userProfile } = useAuth();
  if (!userProfile) return null;

  // Flatten syllabusData if needed (in case of nested arrays)
  const flatSyllabus = Array.isArray(chaptersData)
    ? chaptersData.flat(Infinity).filter((item: any) => item && typeof item === 'object' && 'class_level' in item)
    : [];

  // Filter for user's class
  const classChapters = flatSyllabus.filter((item) => item.class_level === userProfile.class_level);

  // Sort chapters by chapter number if possible
  const sortedChapters = [...classChapters].sort((a: any, b: any) => {
    const getNum = (ch: any) => {
      // Use 'order' if available, else fallback to chapter number in name
      if (typeof ch.order === 'number') return ch.order;
      const match = ch.chapter && ch.chapter.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };
    return getNum(a) - getNum(b);
  });

  // Unlock logic
  const unlockCosts = [0, 150, 350, 600]; // Extend as needed
  // Unlocked chapters: store in userProfile.unlocked_chapters (array of chapter ids)
  const unlockedChapters = userProfile.unlocked_chapters || [sortedChapters[0]?.id];

  // Helper to check if chapter is unlocked
  const isUnlocked = (chapterId: string) => unlockedChapters.includes(chapterId);

  // Helper to get unlock cost for chapter index
  const getUnlockCost = (idx: number) => unlockCosts[idx] !== undefined ? unlockCosts[idx] : (idx * 200 + 100);

  // Unlock handler (requires updateUserProfile in AuthContext)
  const { updateUserProfile } = useAuth();
  const handleUnlock = async (chapterId: string, idx: number) => {
    if (isUnlocked(chapterId)) return;
    const cost = getUnlockCost(idx);
    if ((userProfile.money || 0) < cost) return;
    const newUnlocked = [...unlockedChapters, chapterId];
    await updateUserProfile({
      money: (userProfile.money || 0) - cost,
      unlocked_chapters: newUnlocked
    });
  };

  // Scatter node positions (zig-zag, more horizontal distance)
  // Responsive horizontal position (use % of container width), increase vertical distance
  const nodePositions = sortedChapters.map((_, idx) => ({
    x: `${idx % 2 === 0 ? 20 : 80}%`, // 20% or 80% of container width
    y: 100 + idx * 260 // increased vertical distance
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative overflow-hidden">
      <div
        className="relative z-10 max-w-4xl mx-auto px-4 py-8"
        style={{
          overflowY: 'auto',
          maxHeight: '100vh',
          // Enable horizontal scroll on small screens
          overflowX: 'auto',
          minWidth: '100vw',
        }}
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Your Math Map</h1>
          <p className="text-blue-200 text-lg">Class {userProfile.class_level} Syllabus</p>
        </div>
        <div
          className="relative"
          style={{
            minHeight: nodePositions.length * 260 + 100,
            minWidth: '600px', // ensure enough width for horizontal scroll
          }}
        >
          {/* Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {nodePositions.slice(0, -1).map((pos, idx) => {
              const next = nodePositions[idx + 1];
              return (
                <line
                  key={idx}
                  x1={pos.x}
                  y1={pos.y}
                  x2={next.x}
                  y2={next.y}
                  stroke="#fff"
                  strokeWidth="4"
                  strokeDasharray="10,6"
                  opacity="0.3"
                />
              );
            })}
          </svg>
          {/* Chapter Nodes */}
          {sortedChapters.map((chapter, idx) => {
            const pos = nodePositions[idx];
            const unlocked = isUnlocked(chapter.id);
            const unlockCost = getUnlockCost(idx);
            return (
              <div
                key={chapter.id}
                style={{ position: 'absolute', left: pos.x, top: pos.y, width: 'min(90vw,260px)' }}
                className="flex flex-col items-center"
              >
                <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-4 shadow-2xl transition-all duration-300 ${
                  unlocked ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-500'
                }`}>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white mb-1">Ch {idx + 1}</div>
                    {unlocked ? (
                      <CheckCircle className="h-6 w-6 text-white mx-auto mt-1" />
                    ) : (
                      <Lock className="h-6 w-6 text-white mx-auto mt-1" />
                    )}
                  </div>
                </div>
                <div className="w-60 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/20">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{chapter.chapter}</h3>
                  {/* <div className="text-gray-600 mb-2">{chapter.unit || ''}</div> */}
                  <div className="text-sm text-gray-700 mb-2">Topics:</div>
                  <ul className="list-disc list-inside text-gray-700 mb-2">
                    {chapter.topics && chapter.topics.map((topic: string, tIdx: number) => (
                      <li key={tIdx}>{topic}</li>
                    ))}
                  </ul>
                  {!unlocked && (
                    <button
                      className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
                        (userProfile.money || 0) >= unlockCost
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      onClick={() => handleUnlock(chapter.id, idx)}
                      disabled={(userProfile.money || 0) < unlockCost}
                    >
                      Unlock for {unlockCost} coins
                    </button>
                  )}
                  {unlocked && (
                    <div className="mt-2 px-4 py-2 rounded-lg text-sm font-medium w-full text-center border border-yellow-400 bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400 text-yellow-900 shadow-md">
                      Unlocked at {chapter.unlock_cost} coins
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


