// scripts/prepare-publish.js
const fs = require('fs')
const path = require('path')

const sourceDir = path.resolve(process.cwd())
const targetDir = path.resolve(sourceDir, 'dist')

// Copy package files and strip unwanted deps
fs.mkdirSync(targetDir, { recursive: true })

const pkg = JSON.parse(
  fs.readFileSync(path.join(sourceDir, 'package.json'), 'utf-8'),
)

// Remove workspace deps
for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
  if (pkg[key]) {
    for (const dep in pkg[key]) {
      if (pkg[key][dep].startsWith('workspace:')) {
        delete pkg[key][dep]
      }
    }
  }
}

fs.writeFileSync(
  path.join(targetDir, 'package.json'),
  JSON.stringify(pkg, null, 2),
)
