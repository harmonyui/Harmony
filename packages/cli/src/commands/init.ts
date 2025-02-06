import { Command } from 'commander'
import z from 'zod'
import { writeRepository } from '../utils/write-repository'

const initOptions = z.object({
  cwd: z.string(),
  repositoryId: z.string(),
})

export const init = new Command()
  .name('init')
  .description('initialize a local harmony repository')
  .argument('[repositoryId]')
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd(),
  )
  .action(async (repositoryId, opts) => {
    const options = initOptions.parse({ repositoryId, ...opts })
    await writeRepository(options.cwd, options.repositoryId)
  })
