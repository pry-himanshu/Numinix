import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function handler(event, context) {
  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing or invalid messages array.',
          received: typeof messages,
          body: body
        })
      };
    }

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 65000,
      top_p: 1,
      stream: false
    });

    return {
      statusCode: 200,
      body: JSON.stringify(chatCompletion)
    };
  } catch (error) {
    let errorMessage = 'Unknown error occurred';
    let statusCode = 500;
    if (error.message) {
      errorMessage = error.message;
      if (error.message.includes('rate limit')) {
        statusCode = 429;
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (error.message.includes('authentication')) {
        statusCode = 401;
        errorMessage = 'Authentication failed. Please check API key.';
      } else if (error.message.includes('model')) {
        statusCode = 400;
        errorMessage = 'Invalid model specified.';
      }
    }
    return {
      statusCode,
      body: JSON.stringify({
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
}
