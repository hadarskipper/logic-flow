import express from 'express';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { Octokit } from '@octokit/rest';

const app = express();
const PORT = 3001;

const OWNER = 'hadarskipper';
const REPO = 'my-special-test-flow';
const BRANCH = 'main';

app.use(cors());
app.use(express.json());

// Read secrets once at startup
function getSecrets() {
  const secretsPath = path.join(__dirname, 'secrets.json');
  const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8').replace(/^\uFEFF/, '').trim());
  
  if (!secrets.github?.pat) {
    throw new Error('GitHub PAT not found in secrets.json');
  }
  
  return secrets;
}

// Commit endpoint
app.post('/api/commit', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const secrets = getSecrets();
    const octokit = new Octokit({ auth: secrets.github.pat });

    // Check if file exists
    let fileSha: string | undefined;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: 'test.txt',
        ref: BRANCH,
      });
      if (!Array.isArray(data)) {
        fileSha = data.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
    }

    // Create or update file
    const params: any = {
      owner: OWNER,
      repo: REPO,
      path: 'test.txt',
      message: title,
      content: Buffer.from(content).toString('base64'),
      branch: BRANCH,
    };
    if (fileSha) params.sha = fileSha;

    const { data } = await octokit.rest.repos.createOrUpdateFileContents(params);
    const commitSha = data.commit?.sha;

    res.json({
      success: true,
      commitSha,
      message: 'File committed successfully',
    });
  } catch (error: any) {
    console.error('Commit error:', error);
    
    let errorMessage = 'Failed to commit file';
    if (error.status === 401) {
      errorMessage = 'Authentication failed. Check your GitHub PAT';
    } else if (error.status === 403) {
      errorMessage = 'Access forbidden. PAT needs "repo" permission';
    } else if (error.status === 404) {
      errorMessage = 'Repository not found or no access';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(error.status || 500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

