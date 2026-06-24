// Generates Reprod extension icons (green circle + white dot) with no deps.
// Matches the dashboard nav logo: deep green (#166534) disc, white center dot.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons')
mkdirSync(outDir, { recursive: true })

const GREEN = [22, 101, 52] // #166534
const WHITE = [255, 255, 255]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function makePng(size) {
  const r = size / 2
  const dotR = r * 0.34
  const aa = 1.5 // anti-alias band in px
  // raw RGBA scanlines, each prefixed with a 0 filter byte
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - r
      const dy = y + 0.5 - r
      const dist = Math.sqrt(dx * dx + dy * dy)

      // alpha for the outer disc
      const discA = Math.max(0, Math.min(1, (r - dist) / aa + 0.5))
      // blend factor towards the white dot
      const dotT = Math.max(0, Math.min(1, (dotR - dist) / aa + 0.5))

      const rr = Math.round(GREEN[0] + (WHITE[0] - GREEN[0]) * dotT)
      const gg = Math.round(GREEN[1] + (WHITE[1] - GREEN[1]) * dotT)
      const bb = Math.round(GREEN[2] + (WHITE[2] - GREEN[2]) * dotT)

      const o = y * stride + 1 + x * 4
      raw[o] = rr
      raw[o + 1] = gg
      raw[o + 2] = bb
      raw[o + 3] = Math.round(discA * 255)
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(outDir, `icon${size}.png`), makePng(size))
  console.log(`wrote icon${size}.png`)
}
