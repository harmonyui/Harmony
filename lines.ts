import fs from 'node:fs'
import path from 'node:path'

const countLines = (startPath: string, filter: RegExp): number => {
  if (!fs.existsSync(startPath)) {
    console.log('no dir ', startPath)
    return 0
  }

  const files = fs.readdirSync(startPath)
  let totalLines = 0
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i])
    const stat = fs.lstatSync(filename)
    if (stat.isDirectory()) {
      totalLines += countLines(filename, filter)
    } else if (filter.test(filename.substring(1))) {
      console.log(`Reading ${filename}`)
      const file = fs.readFileSync(filename, 'utf-8')
      const lines = file.split('\n')
      totalLines += lines.length
    }
  }

  return totalLines
}

const filter =
  /^(?!.*[\/\\]\.[^\/\\]*)(?!.*[\/\\]node_modules[\/\\])[^\s.\/\\][^\s]*\.(tsx|jsx|js)$/
console.log(countLines(__dirname, filter))
