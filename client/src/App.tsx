import { useState, useEffect } from 'react';
import './App.css';
import EditSection from './components/EditSection';
import PreviewSection from './components/PreviewSection';
import TestSection from './components/TestSection';
import { useYamlParser } from './hooks/useYamlParser';
import { useNodeClickHandler } from './hooks/useNodeClickHandler';
import { useCommit } from './hooks/useCommit';
import { useTest } from './hooks/useTest';

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loadingInitialContent, setLoadingInitialContent] = useState(true);

  // Fetch latest logic.yaml content on mount
  useEffect(() => {
    const fetchLatestContent = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/fetch');
        const data = await response.json();

        if (response.ok && data.success) {
          if (data.content) {
            setContent(data.content);
          }
          // Optionally set the latest commit SHA if available
          if (data.commitSha) {
            // This will be handled by useCommit hook when needed
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial content:', error);
      } finally {
        setLoadingInitialContent(false);
      }
    };

    fetchLatestContent();
  }, []);

  const parsedTreeData = useYamlParser(content);
  const handleNodeClick = useNodeClickHandler(content);
  const { loading, message, latestCommitSha, handleCommit } = useCommit();
  const { testLoading, terminalOutput, handleRunTest, clearTerminal } = useTest(latestCommitSha);

  const onCommit = () => {
    handleCommit(title, content);
  };

  return (
    <div className="app">
      <div className="container">
        <h1>workflow editor</h1>
        
        <div className="form-section">
          <EditSection
            title={title}
            content={content}
            loading={loading || loadingInitialContent}
            message={message}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onCommit={onCommit}
          />

          <PreviewSection
            title={title}
            parsedTreeData={parsedTreeData}
            onNodeClick={handleNodeClick}
          />
        </div>

        <TestSection
          latestCommitSha={latestCommitSha}
          testLoading={testLoading}
          terminalOutput={terminalOutput}
          onRunTest={handleRunTest}
          onClearTerminal={clearTerminal}
        />
      </div>
    </div>
  );
}

export default App;
