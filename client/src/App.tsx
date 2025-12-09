import { useState } from 'react';
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
            loading={loading}
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
