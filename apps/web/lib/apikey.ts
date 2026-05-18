import { randomBytes, createHash } from 'crypto'

interface GeneratedKey {
  key: string
  keyHash: string
  prefix: string
}

export function generateApiKey(): GeneratedKey {
  const raw = randomBytes(32).toString('hex')
  const key = `rpk_${raw}`
  const prefix = key.slice(0, 12)
  const keyHash = createHash('sha256').update(key).digest('hex')
  return { key, keyHash, prefix }
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}
