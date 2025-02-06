import path from 'node:path'
import fs from 'node:fs'

export const getFileContent = (file: string, basePath: string): string => {
  const fileContents = getFileContentOrEmpty(file, basePath)
  if (fileContents === undefined) {
    throw new Error(`File ${file} not found`)
  }

  return fileContents
}

export const getFileContentOrEmpty = (
  file: string,
  basePath: string,
): string | undefined => {
  const absolute = path.join(basePath, file)
  if (!fs.existsSync(absolute)) {
    return undefined
  }

  return fs.readFileSync(absolute, 'utf-8')
}

export const updateFileContent = (
  file: string,
  basePath: string,
  content: string,
): void => {
  const absolute = path.join(basePath, file)
  fs.writeFileSync(absolute, content, 'utf8')
}
