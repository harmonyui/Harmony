import { Octokit } from "octokit";
import { Changes } from "./local";
import { ComponentElementBase, ComponentLocation } from "@harmony/types/component";

const octokit = new Octokit({
	auth: process.env.GITHUB_API_KEY
});

// Function to create a new branch in the repository
async function createBranch(owner: string, repo: string, baseBranch: string, newBranch: string): Promise<void> {
  try {
    // Get the latest commit SHA from the base branch
    const { data: baseBranchInfo } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch: baseBranch,
    });

    // Create a new branch based on the latest commit SHA
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha: baseBranchInfo.commit.sha,
    });

    console.log(`Branch "${newBranch}" created successfully.`);
  } catch (error) {
    console.error(`Error creating branch: ${error.message}`);
  }
}

// Function to make changes and commit to the new branch
async function updateFileAndCommit(owner: string, repo: string, branch: string, filePath: string, snippet: string, start: number, end: number): Promise<void> {
  try {
    // Get the latest commit SHA from the branch
    const { data: branchInfo } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch,
    });

    // Get the tree SHA associated with the latest commit
    const { data: commitInfo } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: branchInfo.commit.sha,
    });

    // Get the content SHA of the existing file
    const { data: fileInfo } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch,
    });

		if (Array.isArray(fileInfo)) {
			throw new Error('The given file path is a directory');
		}

		if (!('content' in fileInfo)) {
			throw new Error('File info does not have content');
		}

		const contentText = atob(fileInfo.content);
		const newContent = contentText.replaceByIndex(snippet, start, end);

    // Update the content of the existing file
    const {data: updatedFileInfo} = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: 'Update file content',
      content: Buffer.from(newContent).toString('base64'),
      branch,
      sha: fileInfo.sha,
    });
		
    // Create a new commit with the updated file
    await octokit.rest.git.createCommit({
      owner,
      repo,
      message: 'Update file content',
      tree: commitInfo.tree.sha,
      parents: [commitInfo.sha],
      committer: {
        name: 'Your Name',
        email: 'your.email@example.com',
      },
      author: { ...commitInfo.author },
    });

    // Update the branch reference to point to the new commit
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: updatedFileInfo.commit.sha || ''
    });

    console.log('File content updated successfully.');
  } catch (error) {
    console.error(`Error updating file content and committing: ${error.message}`);
  }
}

export async function makeChanges(location: ComponentLocation, newSnippet: string): Promise<void> {
	const owner = 'bradofrado';
	const repo = 'Harmony';
	const branch = 'test-change';
	//await createBranch(owner, repo, 'master', branch);
	await updateFileAndCommit(owner, repo, branch, location.file, newSnippet, location.start, location.end);
}