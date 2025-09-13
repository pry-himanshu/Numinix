
import express from 'express';
import Groq from 'groq-sdk';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/groq-chat', async (req, res) => {
  try {
    const { messages, model } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages array.' });
    }
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: model || 'openai/gpt-oss-20b',
    });
    res.json(chatCompletion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Groq proxy server running on port ${port}`);
});
