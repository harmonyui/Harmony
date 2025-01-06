import { Command } from 'commander'
import z from 'zod'
import { createServer } from '../server'

const startOptionsSchema = z.object({
  port: z.coerce.number(),
  cwd: z.string(),
})

export const start = new Command()
  .name('start')
  .description('start a local harmony server')
  .option('-p, --port <port>', 'port to run the server on', '4300')
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd(),
  )
  .action(async (opts) => {
    const { port, cwd } = startOptionsSchema.parse(opts)
    createServer({ port, path: cwd })
  })
