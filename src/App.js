import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [inputText, setInputText] = useState('');
  const [summary,   setSummary]   = useState('');

  const summarizeText = async () => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    const url    = 
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

      const prompt = `Summarize content you are provided with for a second-grade student: 
      ${inputText}`.trim();
      
    try {
      const { data } = await axios.post(
        `${url}?key=${apiKey}`,                      // pass key in URL :contentReference[oaicite:9]{index=9}
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setSummary(text);
    } catch (err) {
      console.error('API error:', err);
    }
  };

  return (
    <div>
      <h1>Text Summarizer</h1>
      <textarea
        rows={10}
        cols={50}
        value={inputText}
        onChange={e => setInputText(e.target.value)}
      />
      <button onClick={summarizeText}>Summarize</button>
      <pre>{summary}</pre>
    </div>
  );
}

export default App;
