/* eslint-disable @typescript-eslint/prefer-promise-reject-errors -- ok*/
/* eslint-disable @typescript-eslint/no-shadow -- ok*/
/* eslint-disable @typescript-eslint/no-floating-promises -- ok*/
/* eslint-disable @typescript-eslint/prefer-for-of -- ok*/
import fs from 'node:fs'
import path from 'node:path'
import type { ReadFiles } from './indexor'

export const fromDir: ReadFiles = async (
  startPath: string,
  filter: RegExp,
  callback: (filename: string, content: string) => void,
) => {
  if (!fs.existsSync(startPath)) {
    console.log('no dir ', startPath)
    return
  }

  const files = fs.readdirSync(startPath)
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i])
    const stat = fs.lstatSync(filename)
    if (stat.isDirectory()) {
      fromDir(filename, filter, callback)
    } else if (filter.test(filename.substring(1))) {
      callback(filename, fs.readFileSync(filename, 'utf-8'))
    }
  }
}

export const getFile = async (path: string): Promise<string> => {
  if (!fs.existsSync(path)) {
    throw new Error(`Invalid path ${path}`)
  }

  return new Promise<string>((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) {
        reject(err.message)
      }

      resolve(data)
    })
  })
}
