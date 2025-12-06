import { useState } from 'react';
import './App.css';

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [latestCommitSha, setLatestCommitSha] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string>('');

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
        const commitSha = data.commitSha;
        if (commitSha) {
          setLatestCommitSha(commitSha);
        }
        setMessage({ 
          type: 'success', 
          text: `Success! Committed with SHA: ${commitSha?.substring(0, 7) || 'N/A'}` 
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to commit' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunTest = async () => {
    if (!latestCommitSha) {
      setTerminalOutput('Error: No commit SHA available. Please commit first.\n');
      return;
    }

    setTestLoading(true);
    setTerminalOutput('Starting test...\n');
    
    try {
      // Create an empty MP3 file
      const emptyMp3Blob = new Blob([], { type: 'audio/mpeg' });
      const emptyMp3File = new File([emptyMp3Blob], 'empty.mp3', { type: 'audio/mpeg' });
      
      // Create form data
      const formData = new FormData();
      formData.append('audio_file', emptyMp3File);
      
      setTerminalOutput(prev => prev + `Sending request to /process-call...\n`);
      setTerminalOutput(prev => prev + `Commit SHA: ${latestCommitSha.substring(0, 7)}\n`);
      setTerminalOutput(prev => prev + `Call ID: 1\n`);
      setTerminalOutput(prev => prev + `Filename: empty.mp3\n\n`);
      
      const apiUrl = 'http://localhost:8000/process-call';
      const response = await fetch(`${apiUrl}?commit_sha=${latestCommitSha}&call_id=1`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setTerminalOutput(prev => prev + '✓ Test completed successfully!\n\n');
        setTerminalOutput(prev => prev + 'Response:\n');
        setTerminalOutput(prev => prev + JSON.stringify(data, null, 2) + '\n');
        
        // Fetch logs after 5 seconds
        setTerminalOutput(prev => prev + '\n⏳ Waiting 5 seconds before fetching logs...\n');
        setTimeout(async () => {
          try {
            setTerminalOutput(prev => prev + '\n📥 Fetching logs from /logs/1...\n');
            const logsUrl = `http://localhost:8000/logs/1?commit_sha=${latestCommitSha}`;
            const logsResponse = await fetch(logsUrl);
            
            if (logsResponse.ok) {
              const logsData = await logsResponse.json();
              setTerminalOutput(prev => prev + '✓ Logs retrieved successfully!\n\n');
              setTerminalOutput(prev => prev + 'Log File Path: ' + logsData.log_file_path + '\n');
              setTerminalOutput(prev => prev + 'File Size: ' + logsData.file_size_bytes + ' bytes\n');
              setTerminalOutput(prev => prev + 'Last Modified: ' + logsData.last_modified + '\n\n');
              setTerminalOutput(prev => prev + 'Log Content:\n');
              setTerminalOutput(prev => prev + '─'.repeat(60) + '\n');
              setTerminalOutput(prev => prev + logsData.log_content + '\n');
              setTerminalOutput(prev => prev + '─'.repeat(60) + '\n');
            } else {
              const errorData = await logsResponse.json();
              setTerminalOutput(prev => prev + `✗ Failed to fetch logs: ${logsResponse.status}\n\n`);
              setTerminalOutput(prev => prev + 'Error:\n');
              setTerminalOutput(prev => prev + JSON.stringify(errorData, null, 2) + '\n');
            }
          } catch (error: any) {
            setTerminalOutput(prev => prev + `✗ Error fetching logs: ${error.message}\n`);
          }
        }, 5000);
      } else {
        setTerminalOutput(prev => prev + `✗ Test failed with status ${response.status}\n\n`);
        setTerminalOutput(prev => prev + 'Error:\n');
        setTerminalOutput(prev => prev + JSON.stringify(data, null, 2) + '\n');
      }
    } catch (error: any) {
      setTerminalOutput(prev => prev + `✗ Network error: ${error.message}\n`);
      setTerminalOutput(prev => prev + 'Make sure the FastAPI server is running on http://localhost:8000\n');
    } finally {
      setTestLoading(false);
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
          {loading ? 'Committing...' : 'Commit to logic.yaml'}
        </button>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="test-section">
          <h2>Test Section</h2>
          <div className="test-controls">
            <button 
              onClick={handleRunTest} 
              disabled={testLoading || !latestCommitSha}
              className="test-button"
            >
              {testLoading ? 'Running Test...' : 'Run Test'}
            </button>
            {!latestCommitSha && (
              <span className="test-hint">Commit first to enable testing</span>
            )}
          </div>
          <div className="terminal">
            <div className="terminal-header">
              <span className="terminal-title">Terminal Output</span>
              <button 
                onClick={() => setTerminalOutput('')} 
                className="clear-button"
              >
                Clear
              </button>
            </div>
            <pre className="terminal-content">
              {terminalOutput || 'No output yet. Click "Run Test" to start testing...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

