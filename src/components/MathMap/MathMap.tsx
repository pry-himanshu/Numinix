import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DiagnosticTest } from '../DiagnosticTest/DiagnosticTest';
import { EnhancedMathMap } from './EnhancedMathMap';
import { DiagnosticResult } from '../../types';

export function MathMap() {
  const { userProfile } = useAuth();
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  useEffect(() => {
    // Check if user needs to take diagnostic test
    if (userProfile && !userProfile.diagnostic_completed) {
      setShowDiagnostic(true);
    }
  }, [userProfile]);

  const handleDiagnosticComplete = async (result: DiagnosticResult) => {
    setDiagnosticResult(result);
    setShowDiagnostic(false);
    
    // Update user profile to mark diagnostic as completed
    if (userProfile) {
      await userProfile.updateUserProfile({
        diagnostic_completed: true
      });
    }
  };

  const handleSkipDiagnostic = () => {
    setShowDiagnostic(false);
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

  if (showDiagnostic) {
    return (
      <DiagnosticTest 
        onComplete={handleDiagnosticComplete}
        onSkip={handleSkipDiagnostic}
      />
    );
  }

  return (
    <EnhancedMathMap diagnosticResult={diagnosticResult} />
  );
}