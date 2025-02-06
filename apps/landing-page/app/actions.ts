'use server'
import fs from 'node:fs'
import path from 'node:path'

import {
  getNumStars,
  getProjectUrl,
} from '@harmony/server/src/api/services/github'

export async function getGithubStars() {
  return getNumStars()
}

export async function getGithubUrl() {
  return getProjectUrl()
}

export const uploadImage = async (formData: FormData) => {
  const file = formData.get('image') as File
  const fileName = file.name
  const filePath = path.resolve(process.cwd(), `public/${fileName}`)
  const buffer = await file.arrayBuffer()
  fs.writeFileSync(filePath, Buffer.from(buffer))

  return fileName
}
