import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());

const AI_API_ID = 'GYQUJJ22YW';
app.post('/api/ai-solve', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Missing question' });
  }
  try {
    const apiUrl = `https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(question)}&appid=${AI_API_ID}&output=json`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    let solution = '';
    let steps = [];
    let confidence = 0.99;
    if (data.queryresult && data.queryresult.pods) {
      const pods = data.queryresult.pods;
      const resultPod = pods.find((pod) => pod.title === 'Result' || pod.title === 'Solution');
      if (resultPod && resultPod.subpods && resultPod.subpods.length > 0) {
        solution = resultPod.subpods[0].plaintext || '';
      }
      const stepsPod = pods.find((pod) => pod.title.toLowerCase().includes('step'));
      if (stepsPod && stepsPod.subpods) {
        steps = stepsPod.subpods.map((subpod) => subpod.plaintext).filter(Boolean);
      }
    }
    if (!solution) solution = 'No solution found.';
    res.json({ solution, steps, confidence });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get solution from WolframAlpha', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`AI proxy server running on port ${PORT}`);
});
