import { useState } from 'react';

export function useTest(latestCommitSha: string | null) {
  const [testLoading, setTestLoading] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string>('');

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
      setTerminalOutput(prev => prev + `Commit SHA: ${latestCommitSha.substring(0, 8)}\n`);
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
        
        // Fetch results and logs after 5 seconds
        setTerminalOutput(prev => prev + '\n⏳ Waiting 5 seconds before fetching results and logs...\n');
        setTimeout(async () => {
          try {
            // First, fetch results
            setTerminalOutput(prev => prev + '\n📥 Fetching results from /results/1...\n');
            const resultsUrl = `http://localhost:8000/results/1?commit_sha=${latestCommitSha}`;
            const resultsResponse = await fetch(resultsUrl);
            
            if (resultsResponse.ok) {
              const resultsData = await resultsResponse.json();
              setTerminalOutput(prev => prev + '✓ Results retrieved successfully!\n\n');
              setTerminalOutput(prev => prev + 'Results:\n');
              setTerminalOutput(prev => prev + '─'.repeat(60) + '\n');
              setTerminalOutput(prev => prev + JSON.stringify(resultsData, null, 2) + '\n');
              setTerminalOutput(prev => prev + '─'.repeat(60) + '\n');
            } else {
              const errorData = await resultsResponse.json();
              setTerminalOutput(prev => prev + `✗ Failed to fetch results: ${resultsResponse.status}\n\n`);
              setTerminalOutput(prev => prev + 'Error:\n');
              setTerminalOutput(prev => prev + JSON.stringify(errorData, null, 2) + '\n');
            }
            
            // Then fetch logs
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
            setTerminalOutput(prev => prev + `✗ Error fetching results/logs: ${error.message}\n`);
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

  const clearTerminal = () => {
    setTerminalOutput('');
  };

  return {
    testLoading,
    terminalOutput,
    handleRunTest,
    clearTerminal,
  };
}

