// Обновляет встроенную 3D-лабораторию нейросетей (public/nn-3d-viz-lab/) из её репозитория на GitHub.
// Запуск: node tools/sync-neural-lab.mjs [адрес-репозитория] [ветка-или-тег]
// Лаборатория — статический сайт без сборки, поэтому файлы копируются как есть.
// Метаданные источника (адрес, коммит, дата) пишутся в public/nn-3d-viz-lab/.source.json.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repository = process.argv[2] || 'https://github.com/KhursandAtajanovAI/nn-3d-viz-lab.git'
const ref = process.argv[3]
const target = resolve(fileURLToPath(new URL('../public/nn-3d-viz-lab/', import.meta.url)))
// Служебные файлы репозитория лаборатории в платформу не переносим
const skip = new Set(['.git', '.github', '.gitattributes', '.gitignore', '.nojekyll'])

const work = mkdtempSync(join(tmpdir(), 'nn-3d-viz-lab-'))
try {
  const args = ['clone', '--depth', '1', ...(ref ? ['--branch', ref] : []), repository, work]
  execFileSync('git', args, { stdio: 'inherit' })
  const commit = execFileSync('git', ['-C', work, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  rmSync(target, { recursive: true, force: true })
  cpSync(work, target, { recursive: true, filter: source => !skip.has(source.slice(work.length + 1).split(/[\\/]/)[0]) })
  writeFileSync(join(target, '.source.json'), `${JSON.stringify({ repository: repository.replace(/\.git$/, ''), commit, syncedAt: new Date().toISOString() }, null, 2)}\n`)
  console.log(`3D-лаборатория обновлена до ${commit.slice(0, 7)} → ${target}`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
