import chaptersData from '../data/chapters.json';
export interface AIResponse {
	solution: string;
	steps: string[];
	confidence: number;
	error?: string;
}

export async function solveMathProblem(question: string): Promise<AIResponse> {
	try {
		const GROQ_PROXY_URL = 'http://localhost:3001/api/groq-chat';
		const messages = [
			{ role: "system", content: "You are MathMentor, a super-smart, friendly, and fun math assistant inside the Numinix app. You are made just to answer math's related things not other things. use emojis in conversation and make the conversation fun . After solving any mathematical question alway give question like user have asked as challange. Make the conversation airy but well explained. " },
			{ role: "user", content: question }
		];
		const response = await fetch(GROQ_PROXY_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model: "llama-3.1-8b-instant",
				messages
			})
		});
		if (!response.ok) {
			let errorText = await response.text();
			console.error('Groq API error:', response.status, response.statusText, errorText);
			throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
		}
		const data = await response.json();
		return {
			solution: data.choices?.[0]?.message?.content || "",
			steps: [],
			confidence: 1,
			error: undefined
		};
	} catch (error: any) {
		return {
			solution: '',
			steps: [],
			confidence: 0,
			error: error.message
		};
	}
}

// Personalized AI quiz question generator
export async function generateQuestions(userProfile: any, selectedChapters: string[]): Promise<any[]> {
	try {
		const GROQ_PROXY_URL = 'http://localhost:3001/api/groq-chat';
		const classLevel = userProfile.class_level;
		const strengths = userProfile.strengths || [];
		const weaknesses = userProfile.weaknesses || [];
		const unlockedChapters = userProfile.unlocked_chapters || [];
		
		// Get chapter names and topics for selectedChapters
		const selectedChapterObjs = chaptersData
			.filter((ch: any) => selectedChapters.includes(ch.id));
		const selectedChapterNames = selectedChapterObjs.map((ch: any) => ch.chapter);
		// Build a topic map for prompt
		const chapterTopicsList = selectedChapterObjs.map((ch: any) => `- ${ch.chapter}: ${ch.topics && ch.topics.length ? ch.topics.join(', ') : 'No topics listed'}`).join('\n');

		let prompt = `You are a math quiz generator for a class ${classLevel} student. Generate 10 challenging, conceptually deep, and curriculum-appropriate questions for class 9 mathematics ONLY.\n\nIMPORTANT: Only generate questions from these chapters: ${selectedChapterNames.join(', ')}. Do NOT include any questions from chapters that are not in this list.\n\nFor each selected chapter, here are the topics you must use:\n${chapterTopicsList}\n\nDistribute the questions across as many different topics as possible, covering multiple topics from each selected chapter. Do not focus all questions on a single topic.\n\nPersonalize the questions based on the following user profile:\n\nStrengths: ${strengths.length ? strengths.join(', ') : 'None'}\nWeaknesses: ${weaknesses.length ? weaknesses.join(', ') : 'None'}\nUnlocked Chapters: ${unlockedChapters.length ? unlockedChapters.join(', ') : 'None'}\nSelected Chapters: ${selectedChapterNames.join(', ') || 'None'}\n\nRules:\n- All questions must be strictly for class 9th level (no primary or lower-level math).\n- Focus on concepts and topics from ONLY the selected chapters and user weaknesses.\n- At least 3 questions should be hard, 4 medium, and 3 easy, but all must be relevant for class 9th.\n- Each question must have exactly 4 options, with only one correct answer.\n- No repetition of questions or options.\n- No trivial arithmetic (e.g., no simple addition/subtraction like 2+2).\n- Include questions that require reasoning, application, and multi-step thinking.\n- Each question must have a clear, student-friendly explanation.\n- Return ONLY a valid JSON array with this exact structure:\n[\n  { "id": "q1", "question": "What is the value of x if 2x + 5 = 17?", "options": ["5", "6", "7", "8"], "correct_answer": "6", "explanation": "2x + 5 = 17 ⇒ 2x = 12 ⇒ x = 6", "difficulty": "medium", "class_level": 9, "topic": "Linear Equations" }\n]\n\nRequirements:\n- Exactly 10 questions\n- All questions must be for class 9th\n- Mix of easy, medium, and hard (no more than 3 easy)\n- Focus on ONLY the selected chapters and user weaknesses\n- Each question must have exactly 4 options\n- Clear explanations\n- Valid JSON format only, no extra text`;

		const messages = [
			{ role: "system", content: prompt },
			{ role: "user", content: `Generate 10 personalized math quiz questions for class ${classLevel} from ${chaptersData}.` }
		];
		
		const response = await fetch(GROQ_PROXY_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model: "llama-3.1-8b-instant",
				messages
			})
		});
		if (!response.ok) {
			throw new Error(`Groq API error: ${response.statusText}`);
		}
		const data = await response.json();
		console.log('AI raw Groq response:', data);
		let rawText = data.choices?.[0]?.message?.content?.trim() || '';
		console.log('AI rawText before cleanup:', rawText);
		// Clean up the response - remove markdown formatting
		rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
		console.log('AI rawText after cleanup:', rawText);
		// Try to find JSON array in the response
		const jsonMatch = rawText.match(/\[[\s\S]*\]/);
		if (jsonMatch) {
			rawText = jsonMatch[0];
			console.log('AI extracted JSON array:', rawText);
		}
		let generatedQuestions: any[] = [];
		try {
			generatedQuestions = JSON.parse(rawText);
			if (!Array.isArray(generatedQuestions)) {
				throw new Error('Response is not an array');
			}
			   generatedQuestions = generatedQuestions.filter(q => 
				   q.id &&
				   q.question &&
				   Array.isArray(q.options) &&
				   q.options.length > 0 &&
				   q.options.includes(q.correct_answer) && // ensure correct_answer is in options
				   q.explanation &&
				   q.difficulty &&
				   q.topic
			   );
			   // Format question text as markdown if not already
			   generatedQuestions = generatedQuestions.map(q => ({
				   ...q,
				   question: formatQuestionMarkdown(q.question),
			   }));
			   if (generatedQuestions.length === 0) {
				   throw new Error('No valid questions generated');
			   }
			   generatedQuestions = generatedQuestions.slice(0, 10);
// Helper to ensure question text is markdown-formatted
function formatQuestionMarkdown(text: string): string {
	// If already contains markdown (e.g., **, _, $, \n, etc.), return as is
	if (/[*_`$\n]/.test(text)) return text;
	// Add line breaks after question marks and colons for clarity
	let formatted = text.replace(/([?:])\s*/g, '$1\n');
	// Wrap math expressions in $ if simple math detected (e.g., x = 2 + 3)
	formatted = formatted.replace(/(\d+\s*[+\-*/^]\s*\d+)/g, '`$1`');
	return formatted;
}
		} catch (parseError) {
			console.error('JSON Parse Error:', parseError);
			console.error('Raw text:', rawText);
			throw new Error(`Failed to parse AI response: ${parseError}`);
		}
		return generatedQuestions;
	} catch (error: any) {
		console.error('AI Question Generation Error:', error);
		   // Do not return fallback questions; return empty array to indicate failure
		   return [];
	}
}