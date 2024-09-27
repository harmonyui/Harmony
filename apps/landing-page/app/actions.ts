'use server'
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
