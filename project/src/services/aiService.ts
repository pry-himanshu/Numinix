import { GEMINI_API_KEY } from '../config/geminiApiKey';

export interface AIResponse {
  solution: string;
  steps: string[];
  confidence: number;
  error?: string;
}

export async function solveMathProblem(question: string): Promise<AIResponse> {
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `"You are MathMentor, a super-smart, friendly, and fun math assistant inside the Numinix app. Solve the user's math question step by step. Give the answer clearly and also explain the
               reasoning in a simple, engaging way, using emojis and fun comments where appropriate. If the question can be visualized (like graphs, shapes, or patterns), describe it so it feels interactive. Keep the
                tone casual, encouraging, and inspiring, so users feel like they are learning with a cool mentor. What you have to do is you have to give solution like give mathematical step and in next line a one line 
                explanation this explaination should very small, make the mathematical solution different from othere later and at last you have to ask do you need more explaination if yes then explain in full detai."

✅ Optional Enhancements for Extra Cool Factor:

Gamified tone:
"Add little rewards or praise when the user gets it right, like: '🎉 Awesome! You nailed it!'"

Hints mode:
"If the user is stuck, give a small hint first, then the full solution."

Mini challenges:
"Suggest a slightly harder question after solving this one to keep it exciting." ${question}` }] }
          ]
        })
      }
    );

    const data = await response.json();
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return {
        solution: '',
        steps: [],
        confidence: 0.0,
        error: JSON.stringify(data)
      };
    }

    const rawSolution = data.candidates[0].content.parts[0].text;
    const cleaned = rawSolution.replace(/```/g, '').trim();
    const steps = cleaned.split('\n').filter((line: string) => line.trim() !== '');

    return {
      solution: cleaned,
      steps,
      confidence: data.candidates[0].confidence || 0.0
    };
  } catch (error: any) {
    return {
      solution: "AI solution will be available once the API is connected. For now, showing a sample solution format.",
      steps: [],
      confidence: 0.95,
      error: error?.message || String(error)
    };
  }
}

export async function generateQuestions(classLevel: number): Promise<any[]> {
  try {
    // Add a small delay to prevent rapid API calls
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate exactly 10 math quiz questions for class ${classLevel} students. Return ONLY a valid JSON array with this exact structure:

[
  {
    "id": "q1",
    "question": "What is 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "correct_answer": "4",
    "explanation": "2 + 2 equals 4 because we add two and two together.",
    "difficulty": "easy",
    "class_level": ${classLevel},
    "topic": "Addition"
  }
]

Requirements:
- Exactly 10 questions
- Questions appropriate for class ${classLevel}
- Mix of easy, medium, and hard difficulty
- Include topics like: Number Systems, Algebra, Geometry, Arithmetic
- Each question must have exactly 4 options
- Clear explanations
- Valid JSON format only, no extra text`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response structure from AI');
    }

    let rawText = data.candidates[0].content.parts[0].text.trim();
    
    // Clean up the response - remove markdown formatting
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    
    // Remove any leading/trailing backticks
    while (rawText.startsWith('`')) rawText = rawText.slice(1);
    while (rawText.endsWith('`')) rawText = rawText.slice(0, -1);
    
    // Try to find JSON array in the response
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      rawText = jsonMatch[0];
    }

    let generatedQuestions: any[] = [];
    
    try {
      generatedQuestions = JSON.parse(rawText);
      
      // Validate the structure
      if (!Array.isArray(generatedQuestions)) {
        throw new Error('Response is not an array');
      }
      
      // Validate each question has required fields
      generatedQuestions = generatedQuestions.filter(q => 
        q.id && q.question && q.options && Array.isArray(q.options) && 
        q.correct_answer && q.explanation && q.difficulty && q.topic
      );
      
      // Ensure we have at least some questions
      if (generatedQuestions.length === 0) {
        throw new Error('No valid questions generated');
      }
      
      // Limit to 10 questions max
      generatedQuestions = generatedQuestions.slice(0, 10);
      
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw text:', rawText);
      throw new Error(`Failed to parse AI response: ${parseError}`);
    }

    return generatedQuestions;
    
  } catch (error: any) {
    console.error('AI Question Generation Error:', error);
    
    // Return fallback questions instead of error
    return [
      {
        id: "fallback_1",
        question: `What is the value of 5 × 6?`,
        options: ["25", "30", "35", "40"],
        correct_answer: "30",
        explanation: "5 × 6 = 30. When we multiply 5 by 6, we get 30.",
        difficulty: "easy",
        class_level: classLevel,
        topic: "Multiplication"
      },
      {
        id: "fallback_2", 
        question: `If x + 7 = 15, what is the value of x?`,
        options: ["6", "7", "8", "9"],
        correct_answer: "8",
        explanation: "To find x, we subtract 7 from both sides: x = 15 - 7 = 8.",
        difficulty: "medium",
        class_level: classLevel,
        topic: "Algebra"
      },
      {
        id: "fallback_3",
        question: `What is the area of a rectangle with length 8 cm and width 5 cm?`,
        options: ["13 cm²", "26 cm²", "40 cm²", "45 cm²"],
        correct_answer: "40 cm²",
        explanation: "Area of rectangle = length × width = 8 × 5 = 40 cm².",
        difficulty: "easy",
        class_level: classLevel,
        topic: "Geometry"
      }
    ];
  }
}