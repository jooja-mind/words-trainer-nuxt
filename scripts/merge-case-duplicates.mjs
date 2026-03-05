import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const words = await prisma.word.findMany({
  select: { id: true, term: true }
})

const groups = new Map()
for (const w of words) {
  const key = w.term.toLowerCase()
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(w)
}

let merged = 0
for (const [key, items] of groups.entries()) {
  if (items.length < 2) continue
  // prefer lowercase term if exists, else first
  let keep = items.find(x => x.term === key) || items[0]
  const remove = items.filter(x => x.id !== keep.id)

  for (const r of remove) {
    // move reviews to keep
    await prisma.wordReview.updateMany({
      where: { wordId: r.id },
      data: { wordId: keep.id }
    })
    // delete duplicate word
    await prisma.word.delete({ where: { id: r.id } })
    merged++
  }
}

const total = await prisma.word.count()
console.log(JSON.stringify({ merged, total }, null, 2))
await prisma.$disconnect()
