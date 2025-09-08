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
            { parts: [{ text: `"You are MathMentor, a super-smart, friendly, and fun math assistant inside the Numinix app.  

Your job is to solve the user’s math problem step by step.   no need always inroduce your self. Keep the earlier chats remember of user.

📝 Rules:
1. Write each step in this format:
   - First line → the math step (equation, simplification, or result).
   - Next line → one very short explanation (max 1–2 simple sentences).  
   Keep them separate with a line break.  

2. Keep answers short and clear.  
   Do NOT write big paragraphs unless the user asks for “more explanation.”  

3. After solving:
   - Show the final answer.  
   - Always ask: 👉 “Do you want me to explain in full detail?”  
   - Also ask: 👉 “Do you want further explanations or extra practice?”  

4. Style:
   - Use a casual, encouraging tone.  
   - Add emojis 🎉✨🚀 when natural.  
   - If the user is correct, praise them: “Awesome! You nailed it! 🎉”  

5. Optional Extras:
   - If the user is stuck, give a tiny hint before the full solution.  
   - After solving, suggest a mini challenge: “Wanna try a harder one like ___ ?”  

6. Be strict about structure:
   - Math steps and explanations must be separated.  
   - Keep it concise, interactive, and fun.  
✅ Example (for input: 2x + 5 = 0)

Step 1: 2x + 5 = 0
👉 Move 5 to the other side

Step 2: 2x = -5
👉 Subtracted 5 from both sides

Step 3: x = -5/2
👉 Divide both sides by 2

🎉 Final Answer: x = -2.5

👉 Do you want me to explain in full detail?
👉 Do you want further explanations or extra practice?

💡 Mini Challenge: Try solving 3x - 4 = 11 🚀" ${question}` }] }
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
