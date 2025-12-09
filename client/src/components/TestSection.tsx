interface TestSectionProps {
  latestCommitSha: string | null;
  testLoading: boolean;
  terminalOutput: string;
  onRunTest: () => void;
  onClearTerminal: () => void;
}

export default function TestSection({
  latestCommitSha,
  testLoading,
  terminalOutput,
  onRunTest,
  onClearTerminal,
}: TestSectionProps) {
  return (
    <div className="test-section">
      <h2>Test Section</h2>
      <div className="test-controls">
        <button 
          onClick={onRunTest} 
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
            onClick={onClearTerminal} 
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
  );
}

