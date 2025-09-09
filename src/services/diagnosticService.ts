import { GEMINI_API_KEY } from '../config/geminiApiKey';
import { DiagnosticQuestion, DiagnosticResult } from '../types';

export async function generateDiagnosticTest(classLevel: number): Promise<DiagnosticQuestion[]> {
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate exactly 30 diagnostic questions for Class ${classLevel} mathematics. These questions should test prerequisite knowledge for the Number Systems chapter.

Cover these concepts:
- Basic arithmetic operations
- Fractions and decimals
- Integers and rational numbers
- Basic algebra concepts
- Simple geometry
- Number patterns

Return ONLY a valid JSON array with this exact structure:

[
  {
    "id": "diag_1",
    "question": "What is 2/3 + 1/4?",
    "options": ["5/7", "11/12", "3/7", "5/12"],
    "correct_answer": "11/12",
    "explanation": "To add fractions, find common denominator: 2/3 = 8/12, 1/4 = 3/12, so 8/12 + 3/12 = 11/12",
    "difficulty": "medium",
    "topic": "Fractions",
    "concept": "Addition of fractions"
  }
]

Requirements:
- Mix of easy (40%), medium (40%), hard (20%) questions
- Include both MCQ and conceptual questions
- Clear, student-friendly explanations
- Valid JSON format only`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from AI');
    }

    let rawText = data.candidates[0].content.parts[0].text.trim();
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    
    while (rawText.startsWith('`')) rawText = rawText.slice(1);
    while (rawText.endsWith('`')) rawText = rawText.slice(0, -1);
    
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      rawText = jsonMatch[0];
    }

    const questions = JSON.parse(rawText);
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('No valid questions generated');
    }

    return questions.slice(0, 30);
    
  } catch (error) {
    console.error('Diagnostic test generation error:', error);
    
    // Fallback diagnostic questions
    return [
      {
        id: "diag_1",
        question: "What is 15 + 27?",
        options: ["42", "41", "43", "40"],
        correct_answer: "42",
        explanation: "15 + 27 = 42. Add the ones place: 5 + 7 = 12, write 2 carry 1. Add tens: 1 + 2 + 1 = 4.",
        difficulty: "easy",
        topic: "Basic Arithmetic",
        concept: "Addition"
      },
      {
        id: "diag_2",
        question: "Which of these is a rational number?",
        options: ["√2", "π", "3/4", "√5"],
        correct_answer: "3/4",
        explanation: "A rational number can be expressed as p/q where q ≠ 0. 3/4 is in this form.",
        difficulty: "medium",
        topic: "Number Systems",
        concept: "Rational Numbers"
      },
      {
        id: "diag_3",
        question: "What is 2³?",
        options: ["6", "8", "9", "4"],
        correct_answer: "8",
        explanation: "2³ means 2 × 2 × 2 = 8",
        difficulty: "easy",
        topic: "Exponents",
        concept: "Powers"
      }
    ];
  }
}

export async function analyzeDiagnosticResults(
  answers: { questionId: string; answer: string; correct: boolean }[],
  questions: DiagnosticQuestion[]
): Promise<DiagnosticResult> {
  const score = answers.filter(a => a.correct).length;
  const totalQuestions = questions.length;
  
  // Analyze by topic and concept
  const topicScores: { [key: string]: { correct: number; total: number } } = {};
  const conceptScores: { [key: string]: { correct: number; total: number } } = {};
  
  answers.forEach((answer, index) => {
    const question = questions[index];
    if (!question) return;
    
    // Track topic performance
    if (!topicScores[question.topic]) {
      topicScores[question.topic] = { correct: 0, total: 0 };
    }
    topicScores[question.topic].total++;
    if (answer.correct) topicScores[question.topic].correct++;
    
    // Track concept performance
    if (!conceptScores[question.concept]) {
      conceptScores[question.concept] = { correct: 0, total: 0 };
    }
    conceptScores[question.concept].total++;
    if (answer.correct) conceptScores[question.concept].correct++;
  });
  
  // Determine strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const gaps: string[] = [];
  
  Object.entries(topicScores).forEach(([topic, scores]) => {
    const percentage = (scores.correct / scores.total) * 100;
    if (percentage >= 80) {
      strengths.push(topic);
    } else if (percentage >= 50) {
      // Moderate performance - could improve
    } else {
      weaknesses.push(topic);
    }
    
    if (percentage < 30) {
      gaps.push(topic);
    }
  });
  
  // Generate AI-powered recommendations
  const recommendations = await generateRecommendations(strengths, weaknesses, gaps, score, totalQuestions);
  
  return {
    id: Date.now().toString(),
    user_id: '', // Will be set by caller
    score,
    total_questions: totalQuestions,
    strengths,
    weaknesses,
    gaps,
    recommendations,
    completed_at: new Date().toISOString()
  };
}

async function generateRecommendations(
  strengths: string[],
  weaknesses: string[],
  gaps: string[],
  score: number,
  totalQuestions: number
): Promise<string[]> {
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a friendly math mentor helping a student. Based on their diagnostic test results, provide 5-7 personalized recommendations.

Results:
- Score: ${score}/${totalQuestions} (${Math.round((score/totalQuestions)*100)}%)
- Strengths: ${strengths.join(', ') || 'None identified'}
- Weaknesses: ${weaknesses.join(', ') || 'None identified'}
- Major gaps: ${gaps.join(', ') || 'None identified'}

Provide recommendations as a JSON array of strings. Each recommendation should be:
- Encouraging and positive
- Specific and actionable
- Include emojis
- Written like a friendly mentor (never mention you're AI)

Example format:
["Great job on ${strengths[0] || 'basic concepts'}! 🌟 Keep practicing to stay sharp.", "Focus on ${weaknesses[0] || 'problem areas'} with daily 10-minute practice sessions 📚"]

Return only the JSON array.`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      let text = data.candidates[0].content.parts[0].text.trim();
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      
      const recommendations = JSON.parse(text);
      if (Array.isArray(recommendations)) {
        return recommendations;
      }
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
  
  // Fallback recommendations
  const fallbackRecommendations = [
    `You scored ${score}/${totalQuestions}! 🎉 Every step forward is progress.`,
    "Focus on daily practice - even 15 minutes makes a difference! 📚",
    "Don't worry about mistakes - they're stepping stones to success! 💪"
  ];
  
  if (strengths.length > 0) {
    fallbackRecommendations.push(`You're doing great with ${strengths[0]}! 🌟 Keep it up!`);
  }
  
  if (weaknesses.length > 0) {
    fallbackRecommendations.push(`Let's work on ${weaknesses[0]} together - you've got this! 🚀`);
  }
  
  return fallbackRecommendations;
}