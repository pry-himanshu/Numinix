import { DiagnosticQuestion, DiagnosticResult } from '../types';
import chaptersData from '../data/chapters.json';

const GROQ_PROXY_URL = 'http://localhost:3001/api/groq-chat';

export async function generateDiagnosticTest(classLevel: number, chapterId: string): Promise<DiagnosticQuestion[]> {
  const chapter = chaptersData.find(c => c.id === chapterId);
  if (!chapter) {
    throw new Error(`Chapter with id ${chapterId} not found.`);
  }
  try {
    const prerequisiteConcepts = chapter.topics && chapter.topics.length > 0
      ? chapter.topics.map((t: string) => `- ${t}`).join('\n')
      : chapter.chapter;
    const prompt = `You are an expert math educator creating diagnostic questions for Class ${classLevel} based on the prerequisite (basic) concepts required for the chapter: ${chapter.chapter}.

IMPORTANT: Only create mathematics questions. Do NOT include any science, physics, chemistry, or biology content. Focus strictly on math. Options should have a correct option and answer should be 100% correct.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON array
2. No markdown formatting, no explanations, no additional text
3. Must be parseable JSON
4. All options in a question must be unique. There must be only ONE correct answer per question. Do NOT repeat any option or provide two correct answers in the options.

Create exactly 15 diagnostic questions that test prerequisite knowledge needed for the chapter "${chapter.chapter}" in Class ${classLevel} mathematics.

Focus ONLY on these prerequisite concepts (one per question):
${prerequisiteConcepts}

Return this exact JSON structure:
[
  {
    "id": "diag_1",
    "question": "What is 15 + 27?",
    "options": ["42", "41", "43", "40"],
    "correct_answer": "42",
    "explanation": "15 + 27 = 42. Add ones: 5+7=12, write 2 carry 1. Add tens: 1+2+1=4.",
    "difficulty": "medium",
    "topic": "Basic Arithmetic",
    "concept": "Addition"
  }
]

Requirements:
- Mix of difficulties: 6 easy, 6 medium, 3 hard
- Test prerequisite knowledge only
- Each question should clearly state the concept it tests
- Clear, student-friendly explanations
- Return ONLY the JSON array`;

    const response = await fetch(GROQ_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Generate 15 diagnostic math questions as described.' }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      let text = data.choices?.[0]?.message?.content?.trim() || '';
      // Extract JSON array
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
        const jsonString = text.substring(firstBracket, lastBracket + 1);
        try {
          const questions = JSON.parse(jsonString);
          if (Array.isArray(questions) && questions.length > 0) {
            return questions;
          }
        } catch (parseError) {
          console.error('AI questions JSON parsing failed:', parseError);
        }
      }
    }
    // If anything fails, fall through to fallback
    return generateFallbackDiagnosticQuestions(classLevel);
  } catch (error) {
    console.error('Diagnostic test generation error:', error);
    // Fallback to preloaded questions
    return generateFallbackDiagnosticQuestions(classLevel);
  }
}



function generateFallbackDiagnosticQuestions(classLevel: number): DiagnosticQuestion[] {
  const baseQuestions: DiagnosticQuestion[] = [
    {
      id: "fallback_1",
      question: "What is 15 + 27?",
      options: ["42", "41", "43", "40"],
      correct_answer: "42",
      explanation: "15 + 27 = 42. Add the ones place: 5 + 7 = 12, write 2 carry 1. Add tens: 1 + 2 + 1 = 4.",
      difficulty: "easy",
      topic: "Basic Arithmetic",
      concept: "Addition"
    },
    {
      id: "fallback_2",
      question: "Which of these is a rational number?",
      options: ["√2", "π", "3/4", "√5"],
      correct_answer: "3/4",
      explanation: "A rational number can be expressed as p/q where q ≠ 0. 3/4 is in this form.",
      difficulty: "medium",
      topic: "Number Systems",
      concept: "Rational Numbers"
    },
    {
      id: "fallback_3",
      question: "What is 2³?",
      options: ["6", "8", "9", "4"],
      correct_answer: "8",
      explanation: "2³ means 2 × 2 × 2 = 8",
      difficulty: "easy",
      topic: "Exponents",
      concept: "Powers"
    },
    {
      id: "fallback_4",
      question: "What is the area of a square with side 5 cm?",
      options: ["20 cm²", "25 cm²", "10 cm²", "15 cm²"],
      correct_answer: "25 cm²",
      explanation: "Area of square = side × side = 5 × 5 = 25 cm²",
      difficulty: "easy",
      topic: "Geometry",
      concept: "Area calculation"
    },
    {
      id: "fallback_5",
      question: "If 3x = 15, what is x?",
      options: ["3", "4", "5", "6"],
      correct_answer: "5",
      explanation: "To find x, divide both sides by 3: x = 15 ÷ 3 = 5",
      difficulty: "medium",
      topic: "Algebra",
      concept: "Simple equations"
    }
  ];

  // Add more questions to reach 15
  const additionalQuestions: DiagnosticQuestion[] = [];
  for (let i = 6; i <= 15; i++) {
    additionalQuestions.push({
      id: `fallback_${i}`,
      question: `What is ${i + 2} + ${i + 3}?`,
      options: [`${2*i + 4}`, `${2*i + 5}`, `${2*i + 6}`, `${2*i + 7}`],
      correct_answer: `${2*i + 5}`,
      explanation: `${i + 2} + ${i + 3} = ${2*i + 5}`,
      difficulty: i % 3 === 0 ? "hard" : i % 2 === 0 ? "medium" : "easy",
      topic: "Basic Arithmetic",
      concept: "Addition"
    });
  }

  return [...baseQuestions, ...additionalQuestions];
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
    const GROQ_PROXY_URL = 'http://localhost:3001/api/groq-chat';
  let prompt = `You are a friendly math mentor. Based on the following diagnostic results, provide 5 personalized recommendations.\n\nResults:\n- Score: ${score}/${totalQuestions} (${Math.round((score/totalQuestions)*100)}%)\n- Strengths: ${strengths.join(', ') || 'None identified'}\n- Weaknesses: ${weaknesses.join(', ') || 'None identified'}\n- Major gaps: ${gaps.join(', ') || 'None identified'}\n\nReturn ONLY a JSON array of recommendation strings:\n[\"recommendation 1\", \"recommendation 2\", ...]\n\nEach recommendation should be:\n- Encouraging and positive\n- Specific and actionable\n- Include emojis\n- Written like a friendly mentor`;

    const response = await fetch(GROQ_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Generate 5 personalized math study recommendations. based on ' }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      let text = data.choices?.[0]?.message?.content?.trim() || '';
      // Extract JSON array
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
        const jsonString = text.substring(firstBracket, lastBracket + 1);
        try {
          const recommendations = JSON.parse(jsonString);
          if (Array.isArray(recommendations)) {
            return recommendations;
          }
        } catch (parseError) {
          console.error('Recommendations JSON parsing failed:', parseError);
        }
      }
    }
    // If anything fails, fall through to fallback
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
  }
  // Fallback recommendations
  return [
    `You scored ${score}/${totalQuestions}! 🎉 Every step forward is progress.`,
    "Focus on daily practice - even 15 minutes makes a difference! 📚",
    "Don't worry about mistakes - they're stepping stones to success! 💪",
    ...(strengths.length > 0 ? [`You're doing great with ${strengths[0]}! 🌟 Keep it up!`] : []),
    ...(weaknesses.length > 0 ? [`Let's work on ${weaknesses[0]} together - you've got this! 🚀`] : [])
  ];
}