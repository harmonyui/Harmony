import path from 'node:path'
import fs from 'node:fs'

export const getFileContent = (file: string, basePath: string): string => {
  const absolute = path.join(basePath, file)
  if (!fs.existsSync(absolute)) {
    throw new Error(`Invalid path ${absolute}`)
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
