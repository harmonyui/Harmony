/* eslint-disable no-await-in-loop -- ok*/
import { ComponentLocation } from "@harmony/util/src/types/component";
import { ReadFiles } from "./indexor";
import { GitRepository } from "../../repository/github";

export const fromGithub: (gitRepository: GitRepository) => ReadFiles = (gitRepository) => async (startPath, filter, callback) => {
	const files = await gitRepository.getContentOrDirectory(startPath);

	if (Array.isArray(files)) {
		for (const info of files) {
			if (info.type === 'dir' || filter.test(info.path)) {
				await fromGithub(gitRepository)(info.path, filter, callback);
			}
		}
	} else if ('content' in files && filter.test(files.path)) {
		callback(files.path, atob(files.content));
	}
}

export const getFileContent = async (gitRepository: GitRepository, file: string, branch: string) => {
	const fileContent = await gitRepository.getContent(file, branch);

	return fileContent;
}

export const getCodeSnippet = (gitRepository: GitRepository) => async ({file, start, end}: ComponentLocation, branch: string): Promise<string> => {
	const fileContent = await getFileContent(gitRepository, file, branch);
	return fileContent.substring(start, end);
}