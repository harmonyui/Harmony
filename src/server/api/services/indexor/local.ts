import fs from 'node:fs';
import path from 'node:path';
import { ReadFiles } from "./indexor";

export const fromDir: ReadFiles = async (startPath: string, filter: RegExp, callback: (filename: string, content: string) => void) => {
	if (!fs.existsSync(startPath)) {
		console.log("no dir ", startPath);
		return;
	}

	var files = fs.readdirSync(startPath);
	for (var i = 0; i < files.length; i++) {
			var filename = path.join(startPath, files[i]);
			var stat = fs.lstatSync(filename);
			if (stat.isDirectory()) {
					fromDir(filename, filter, callback); 
			} else if (filter.test(filename.substring(1))) {
				callback(filename, fs.readFileSync(filename, 'utf-8'));
			}
	};
};