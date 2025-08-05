import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const summarizeText = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to summarize');
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');

    try {
      const response = await axios.post('http://localhost:5000/api/summarize', {
        text: inputText
      });

      setSummary(response.data.summary);
    } catch (err) {
      console.error('API error:', err);
      setError(err.response?.data?.error || 'Failed to summarize text');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Text Summarizer</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <textarea
          rows={10}
          cols={50}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Enter text to summarize..."
          style={{ width: '100%', padding: '10px', fontSize: '14px' }}
        />
      </div>

      <button 
        onClick={summarizeText}
        disabled={loading || !inputText.trim()}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Summarizing...' : 'Summarize'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          Error: {error}
        </div>
      )}

      {summary && (
        <div style={{ marginTop: '20px' }}>
          <h3>Summary:</h3>
          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5'
          }}>
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;