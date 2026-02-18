import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

const prisma = new PrismaClient()

const raw = readFileSync('data/imports/teacher-2026-02-18-batch-2.txt','utf8')
  .replace(/\r\n/g,' ')
  .trim()

const terms = [
  'transformation','cumulative','ecosystem','threats','ironically','paradoxically','seemingly','ostensibly','unequivocally','undoubtedly','inevitably','consequently','accordingly','unabashedly','surreptitiously','painstakingly','meticulously','effortlessly','disconcerting','clandestinely','blatantly','begrudgingly','vastly','disproportionately','egregiously','strikingly','remarkably','profoundly','utterly','exceedingly','capricious','belligerent','arcane','ambivalent','acrimonious','abstruse','aberration','backtrack','swam','aptitude','trial','ceramic','saline','revered','peroxide'
]

const indices = []
for (const term of terms) {
  const re = new RegExp(`\\b${term}\\b`, 'i')
  const m = re.exec(raw)
  if (!m) continue
  indices.push({ term, index: m.index })
}
indices.sort((a,b)=>a.index-b.index)

const entries = []
for (let i=0;i<indices.length;i++) {
  const cur = indices[i]
  const next = indices[i+1]
  const start = cur.index + cur.term.length
  const end = next ? next.index : raw.length
  const def = raw.slice(start, end).trim()
  if (def) entries.push({ term: cur.term, definition: def })
}

let added=0, updated=0, skipped=0
const warnings = []
for (const item of entries) {
  const term = item.term.trim().toLowerCase()
  const definition = item.definition.replace(/\s+/g,' ').trim()
  if (!term || !definition) continue

  const defWords = definition.split(' ').filter(Boolean).length
  if (defWords < 4) warnings.push({ term, definition })

  const existing = await prisma.word.findFirst({
    where: { term: { equals: term, mode: 'insensitive' } }
  })

  if (existing) {
    if (!existing.definition || existing.definition.trim() !== definition) {
      await prisma.word.update({ where: { id: existing.id }, data: { term, definition } })
      updated++
    } else {
      skipped++
    }
  } else {
    await prisma.word.create({ data: { term, definition, status: 'NEW' } })
    added++
  }
}
const total = await prisma.word.count()
console.log(JSON.stringify({ parsed: entries.length, added, updated, skipped, total, warnings }, null, 2))
await prisma.$disconnect()
