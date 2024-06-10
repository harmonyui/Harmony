/* eslint-disable @typescript-eslint/require-await -- ok*/
/* eslint-disable no-useless-escape -- ok*/
/* eslint-disable no-await-in-loop -- ok*/
import type { ComponentLocation } from "@harmony/util/src/types/component";
import { isValidPath } from "@harmony/util/src/utils/common";
import type { GitRepository } from "../../repository/github";
import type { GithubCache } from "../../repository/cache";

export interface FileAndContent {
	file: string;
	content: string;
}

export class IndexingFiles {
	constructor(private gitRepository: GitRepository, private githubCache: GithubCache) {}

	public async getIndexingFilesAndContent(startDirName: string): Promise<FileAndContent[]> {
		const cachesFiles = await this.getFilesCache();
		if (cachesFiles) {
			return cachesFiles;
		}

		const fileContents: FileAndContent[] = [];
		await this.fromDir(startDirName, (filename, content) => {
			fileContents.push({file: filename, content});
		});

		if (fileContents.length === 0) {
			throw new Error("No files were found");
		}

		await this.setFilesCache(fileContents);

		return fileContents;
	}

	private async getFilesCache(): Promise<FileAndContent[] | null> {
		const key = await this.getCacheKey();
		const cachedFiles = await this.githubCache.getIndexingFiles(key);
		const filesAndContents: FileAndContent[] = [];
		
		if (cachedFiles) {
			await Promise.all(cachedFiles.map(async (file) => {
				const content = await this.gitRepository.getContent(file);
				filesAndContents.push({content, file})
			}));
			return filesAndContents
		}

		return null;
	}

	private async getCacheKey(): Promise<{repo: string, ref: string}> {
		const ref = this.gitRepository.repository.ref;
		const repo = this.gitRepository.repository.name;
		return {ref, repo};
	}

	private async setFilesCache(fileContents: FileAndContent[]): Promise<void> {
		const key = await this.getCacheKey();
		await this.githubCache.setIndexingFiles(key, fileContents.map(fileContent => fileContent.file));
	}

	private async fromDir(startPath: string, callback: (filename: string, content: string) => void) {
		const files = await this.gitRepository.getContentOrDirectory(startPath);

		if (Array.isArray(files)) {
			for (const info of files) {
				if (info.type === 'dir' || isValidPath(info.path)) {
					await this.fromDir(info.path, callback);
				}
			}
		} else if ('content' in files && isValidPath(files.path)) {
			callback(files.path, atob(files.content));
		}
	}
}

export const getCodeSnippet = (gitRepository: GitRepository) => async ({file, start, end}: ComponentLocation, branch: string): Promise<string> => {
	const fileContent = await gitRepository.getContent(file, branch);
	return fileContent.substring(start, end);
}