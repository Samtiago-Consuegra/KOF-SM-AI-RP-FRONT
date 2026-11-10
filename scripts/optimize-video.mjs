/**
 * Optimiza el video del panel de login:
 *
 *  1. Extrae un fotograma representativo y lo exporta como poster WebP.
 *  2. Recomprime el MP4 a H.264 sin audio con un objetivo de ≤ 1 MB.
 *
 * Usa el `ffmpeg` del PATH si existe; si no, el binario de `ffmpeg-static`
 * (devDependency). El original se conserva: el resultado se escribe en
 * `CC-Bear-min.mp4` y es el archivo que importa el componente.
 *
 * Uso: npm run optimize:video
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readdir, stat, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import ffmpegStatic from 'ffmpeg-static'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const INPUT = path.join(ROOT, 'src', 'assets', 'CC-Bear.mp4')
const POSTER = path.join(ROOT, 'src', 'assets', 'CC-Bear-poster.webp')
const OUTPUT = path.join(ROOT, 'src', 'assets', 'CC-Bear-min.mp4')

const MAX_BYTES = 1_000_000
const POSTER_AT = '0.3'
const POSTER_WIDTH = 800
const POSTER_QUALITY = 80

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`

function resolveFfmpeg() {
  const fromEnv = process.env.FFMPEG_PATH
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  if (ffmpegStatic && existsSync(ffmpegStatic)) return ffmpegStatic
  try {
    const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
    if (probe.status === 0) return 'ffmpeg'
  } catch {
    // sin ffmpeg en PATH
  }
  return null
}

const ffmpeg = resolveFfmpeg()
if (!ffmpeg) {
  console.error('[optimize-video] No se encontró ffmpeg. Instala ffmpeg-static o define FFMPEG_PATH.')
  process.exit(1)
}
if (!existsSync(INPUT)) {
  console.error('[optimize-video] Falta el video de origen:', INPUT)
  process.exit(1)
}

function run(args, { allowFail = false } = {}) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status !== 0 && !allowFail) {
    console.error(result.stderr || result.stdout || '')
    throw new Error(`ffmpeg falló con código ${result.status}`)
  }
  return result
}

function readDuration() {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-i', INPUT], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  const text = `${result.stderr || ''}${result.stdout || ''}`
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)
  if (!match) throw new Error('No se pudo leer la duración del video')
  const [, h, m, s] = match
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

// --- Poster -----------------------------------------------------------------
const posterFrame = path.join(tmpdir(), `kof-poster-${process.pid}.png`)
run(['-y', '-ss', POSTER_AT, '-i', INPUT, '-frames:v', '1', '-update', '1', posterFrame])
await sharp(posterFrame)
  .resize({ width: POSTER_WIDTH, withoutEnlargement: true })
  .webp({ quality: POSTER_QUALITY, effort: 5 })
  .toFile(POSTER)
await unlink(posterFrame).catch(() => {})

const posterStat = await stat(POSTER)
console.log(`[optimize-video] Poster ${POSTER_AT}s → ${path.basename(POSTER)} · ${kb(posterStat.size)}`)

// --- Video ------------------------------------------------------------------
const duration = readDuration()
const passLog = path.join(tmpdir(), `kof-ffpass-${process.pid}`)
const sourceStat = await stat(INPUT)

// 90 % del objetivo para dejar margen al contenedor MP4.
const baseBitrate = Math.max(200_000, Math.floor((MAX_BYTES * 8 * 0.9) / duration))
const attempts = [1, 0.82, 0.68]
let best = null

for (const factor of attempts) {
  const bitrate = Math.floor(baseBitrate * factor)
  const br = `${bitrate}`

  run(['-y', '-i', INPUT, '-an', '-c:v', 'libx264', '-preset', 'slow', '-b:v', br, '-pass', '1', '-passlogfile', passLog, '-f', 'null', '-'])
  run([
    '-y', '-i', INPUT,
    '-an',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-b:v', br,
    '-pass', '2',
    '-passlogfile', passLog,
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    OUTPUT,
  ])

  const size = (await stat(OUTPUT)).size
  best = { size, bitrate }
  if (size <= MAX_BYTES) break
  console.warn(`[optimize-video] ${kb(size)} > 1000 KB con ${Math.round(bitrate / 1000)} kb/s; reintentando…`)
}

// Limpia los logs de las dos pasadas.
try {
  const files = await readdir(tmpdir())
  await Promise.all(
    files.filter((f) => f.startsWith(path.basename(passLog))).map((f) => unlink(path.join(tmpdir(), f)).catch(() => {})),
  )
} catch {
  // limpieza best-effort
}

const saved = ((1 - best.size / sourceStat.size) * 100).toFixed(1)
console.log(
  `[optimize-video] ${path.basename(INPUT)} → ${path.basename(OUTPUT)} · ` +
    `${kb(sourceStat.size)} → ${kb(best.size)} (-${saved}%) · ${Math.round(best.bitrate / 1000)} kb/s`,
)

if (best.size > MAX_BYTES) {
  console.warn('[optimize-video] Aún supera 1 MB; ajusta MAX_BYTES o recorta la duración.')
} else {
  console.log('[optimize-video] Listo (≤ 1 MB).')
}
