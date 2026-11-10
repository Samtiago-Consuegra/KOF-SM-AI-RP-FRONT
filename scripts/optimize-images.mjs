/**
 * Convierte las ilustraciones de máquinas a WebP.
 *
 * Los PNG originales se conservan como fuente: Vite solo empaqueta lo que se
 * importa, así que basta con que `FichaEquipo.jsx` apunte a los `.webp`.
 *
 * Uso: npm run optimize:images
 */
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'src', 'assets', 'maquinas')
const MAX_WIDTH = 800
const QUALITY = 80

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`

const files = (await readdir(DIR)).filter((name) => name.toLowerCase().endsWith('.png')).sort()

if (!files.length) {
  console.warn('[optimize-images] No se encontraron PNG en', DIR)
  process.exit(0)
}

for (const name of files) {
  const source = path.join(DIR, name)
  const target = path.join(DIR, name.replace(/\.png$/i, '.webp'))

  const before = await stat(source)
  const image = sharp(source)
  const meta = await image.metadata()

  await image
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 5 })
    .toFile(target)

  const after = await stat(target)
  const saved = ((1 - after.size / before.size) * 100).toFixed(1)

  console.log(
    `[optimize-images] ${name} → ${path.basename(target)} · ` +
      `${meta.width}×${meta.height} → máx. ${MAX_WIDTH}px · ` +
      `${kb(before.size)} → ${kb(after.size)} (-${saved}%)`,
  )
}

console.log('[optimize-images] Listo.')
