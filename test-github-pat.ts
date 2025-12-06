import * as fs from 'fs';
import * as path from 'path';
import { Octokit } from '@octokit/rest';

const OWNER = 'hadarskipper';
const REPO = 'my-special-test-flow';
const BRANCH = 'main';

async function testGitHubPAT() {
  try {
    // Read secrets
    const secretsPath = path.join(__dirname, 'secrets.json');
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8').replace(/^\uFEFF/, '').trim());
    
    if (!secrets.github?.pat) {
      throw new Error('GitHub PAT not found in secrets.json');
    }

    // Initialize GitHub client
    const octokit = new Octokit({ auth: secrets.github.pat });

    // Check if file exists
    let fileSha: string | undefined;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: 'logic.yaml',
        ref: BRANCH,
      });
      if (!Array.isArray(data)) {
        fileSha = data.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) throw error;
    }

    // Create or update file
    const content = `This is a test file created at ${new Date().toISOString()}\nGitHub PAT test successful!\n`;
    const params: any = {
      owner: OWNER,
      repo: REPO,
      path: 'logic.yaml',
      message: 'test: Add logic.yaml file to verify GitHub PAT',
      content: Buffer.from(content).toString('base64'),
      branch: BRANCH,
    };
    if (fileSha) params.sha = fileSha;

    const { data } = await octokit.rest.repos.createOrUpdateFileContents(params);
    const commitSha = Array.isArray(data) ? null : data.commit?.sha;

    console.log('SUCCESS! GitHub PAT is valid and working.');
    console.log(`File pushed to ${OWNER}/${REPO}:${BRANCH}`);
    if (commitSha) console.log(`Commit: ${commitSha.substring(0, 7)}`);
    console.log(`View: https://github.com/${OWNER}/${REPO}/blob/${BRANCH}/logic.yaml`);

  } catch (error: any) {
    console.error('ERROR: GitHub PAT test failed!');
    if (error.status === 401) {
      console.error('Authentication failed. Check your PAT in secrets.json');
    } else if (error.status === 403) {
      console.error('Access forbidden. PAT needs "repo" permission');
    } else if (error.status === 404) {
      console.error('Repository not found or no access');
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testGitHubPAT();
