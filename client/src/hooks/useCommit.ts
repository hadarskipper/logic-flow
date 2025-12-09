import { useState } from 'react';
import { Message } from '../types';

export function useCommit() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [latestCommitSha, setLatestCommitSha] = useState<string | null>(null);

  const handleCommit = async (title: string, content: string) => {
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
          text: `Success! Committed with SHA: ${commitSha?.substring(0, 8) || 'N/A'}` 
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

  return {
    loading,
    message,
    latestCommitSha,
    handleCommit,
  };
}

