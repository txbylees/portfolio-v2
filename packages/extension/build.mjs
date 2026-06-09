import * as esbuild from 'esbuild'
import { copyFileSync, mkdirSync } from 'fs'

const watch = process.argv.includes('--watch')
mkdirSync('dist', { recursive: true })

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
  console.log('Build complete → dist/')
}
