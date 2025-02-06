#!/usr/bin/env node
import { Command } from 'commander'
import packageJson from '../package.json'
import { start } from './commands/start'
import { init } from './commands/init'

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

async function main() {
  const program = new Command()
    .name('harmonyapp')
    .description('start a local harmony ui development server')
    .version(
      packageJson.version || '1.0.0',
      '-v, --version',
      'display the version number',
    )

  program.addCommand(start)
  program.addCommand(init)

  program.parse()
}

main()
