import { useState } from 'react';
import './App.css';

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCommit = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Please fill in both title and content' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Success! Committed with SHA: ${data.commitSha?.substring(0, 7) || 'N/A'}` 
        });
        setTitle('');
        setContent('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to commit' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>GitHub Code Commit</h1>
        
        <div className="form-group">
          <label htmlFor="title">Commit Title:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter commit message..."
            className="title-input"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Code Content:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your code here..."
            className="content-textarea"
            disabled={loading}
          />
        </div>

        <button 
          onClick={handleCommit} 
          disabled={loading || !title.trim() || !content.trim()}
          className="commit-button"
        >
          {loading ? 'Committing...' : 'Commit to test.txt'}
        </button>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

