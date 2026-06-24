import * as esbuild from 'esbuild'
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs'

const watch = process.argv.includes('--watch')
mkdirSync('dist', { recursive: true })

function copyIcons() {
  if (!existsSync('icons')) return
  mkdirSync('dist/icons', { recursive: true })
  for (const file of readdirSync('icons')) {
    copyFileSync(`icons/${file}`, `dist/icons/${file}`)
  }
}

const base = {
  bundle: true,
  format: /** @type {const} */ ('iife'),
  target: 'chrome120',
  platform: 'browser',
  minify: !watch,
}

if (watch) {
  const [contentCtx, bgCtx, popupCtx] = await Promise.all([
    esbuild.context({ ...base, entryPoints: ['src/content.ts'], outfile: 'dist/content.js' }),
    esbuild.context({ ...base, entryPoints: ['src/background.ts'], outfile: 'dist/background.js' }),
    esbuild.context({ ...base, entryPoints: ['src/popup.ts'], outfile: 'dist/popup.js' }),
  ])
  await Promise.all([contentCtx.watch(), bgCtx.watch(), popupCtx.watch()])
  copyFileSync('manifest.json', 'dist/manifest.json')
  copyFileSync('src/popup.html', 'dist/popup.html')
  copyIcons()
  console.log('Watching for changes...')
} else {
  await Promise.all([
    esbuild.build({ ...base, entryPoints: ['src/content.ts'], outfile: 'dist/content.js' }),
    esbuild.build({ ...base, entryPoints: ['src/background.ts'], outfile: 'dist/background.js' }),
    esbuild.build({ ...base, entryPoints: ['src/popup.ts'], outfile: 'dist/popup.js' }),
    esbuild.build({ ...base, entryPoints: ['src/injected.ts'], outfile: 'dist/injected.js' }),
  ])
  copyFileSync('manifest.json', 'dist/manifest.json')
  copyFileSync('src/popup.html', 'dist/popup.html')
  copyIcons()
  console.log('Build complete → dist/')
}
