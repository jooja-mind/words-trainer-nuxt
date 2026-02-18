import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const items = [
  {
    term: 'Aberration',
    definition: 'noun — a departure from what is normal, usual, or expected (often unwelcome). Mnemonic: anomaly.',
    example: 'The sudden warm weather in January was an aberration in this normally frigid climate.'
  },
  {
    term: 'Abstruse',
    definition: 'adjective — difficult to understand; obscure or complex.',
    example: "The philosopher's abstruse arguments left most of the audience puzzled."
  },
  {
    term: 'Acrimonious',
    definition: 'adjective — angry and bitter in speech or debate. Mnemonic: acidic tone.',
    example: 'The divorce proceedings turned acrimonious, with both sides hurling insults.'
  },
  {
    term: 'Ambivalent',
    definition: 'adjective — having mixed feelings or contradictory ideas about something.',
    example: 'She felt ambivalent about the promotion—it meant more money but less time with family.'
  },
  {
    term: 'Arcane',
    definition: 'adjective — mysterious or secret; understood by few. Mnemonic: esoteric.',
    example: 'The professor specialized in arcane rituals from ancient civilizations.'
  },
  {
    term: 'Belligerent',
    definition: 'adjective — hostile and aggressive.',
    example: 'His belligerent attitude during the meeting alienated his colleagues.'
  },
  {
    term: 'Capricious',
    definition: 'adjective — given to sudden and unaccountable changes of mood or behavior; impulsive.',
    example: 'The CEO was capricious, changing priorities without warning.'
  },
  { term: 'Exceedingly', definition: 'adverb — to an unusually high degree.', example: 'The task was exceedingly difficult.' },
  { term: 'Utterly', definition: 'adverb — completely; totally (often with negative nuance).', example: 'She was utterly devastated by the news.' },
  { term: 'Profoundly', definition: 'adverb — deeply or intensely (affecting thought or emotion).', example: 'His speech was profoundly moving.' },
  { term: 'Remarkably', definition: 'adverb — in a way worthy of attention; surprisingly.', example: 'She recovered remarkably quickly.' },
  { term: 'Strikingly', definition: 'adverb — in a very noticeable or impressive way.', example: 'Their styles are strikingly similar.' },
  { term: 'Egregiously', definition: 'adverb — in a shockingly bad or unacceptable way.', example: 'The decision was egregiously unfair.' },
  { term: 'Disproportionately', definition: 'adverb — to an extent that is too large/small in relation to something else.', example: 'Minor issues affected him disproportionately.' },
  { term: 'Vastly', definition: 'adverb — by a very great amount.', example: 'The new model is vastly superior.' },
  { term: 'Begrudgingly', definition: 'adverb — in a reluctant or resentful way.', example: 'He begrudgingly admitted his mistake.' },
  { term: 'Blatantly', definition: 'adverb — in a very obvious and shameless way.', example: 'She blatantly ignored the rules.' },
  { term: 'Clandestinely', definition: 'adverb — secretly or in a hidden way.', example: 'They met clandestinely to avoid detection.' },
  { term: 'Disconcertingly', definition: 'adverb — in a way that causes unease or confusion.', example: 'He smiled disconcertingly during the argument.' },
  { term: 'Effortlessly', definition: 'adverb — without difficulty or apparent effort.', example: 'She sings effortlessly.' },
  { term: 'Meticulously', definition: 'adverb — with great care and precision.', example: 'The report was meticulously researched.' },
  { term: 'Painstakingly', definition: 'adverb — with careful effort and attention to detail.', example: 'The artist painstakingly restored the painting.' },
  { term: 'Surreptitiously', definition: 'adverb — secretly, especially to avoid notice.', example: 'He surreptitiously checked his phone.' },
  { term: 'Unabashedly', definition: 'adverb — without shame or embarrassment.', example: 'She unabashedly expressed her opinions.' },
  { term: 'Accordingly', definition: 'adverb — in a way appropriate to the situation; correspondingly.', example: 'The rules changed; accordingly, we adapted.' },
  { term: 'Consequently', definition: 'adverb — as a result.', example: 'He was late; consequently, he missed the start.' },
  { term: 'Inevitably', definition: 'adverb — in a way that cannot be avoided.', example: 'Arguments inevitably arise in such discussions.' },
  { term: 'Undoubtedly', definition: 'adverb — without doubt; certainly.', example: 'She is undoubtedly the best candidate.' },
  { term: 'Unequivocally', definition: 'adverb — in a way that leaves no room for doubt.', example: 'He unequivocally denied the accusations.' },
  { term: 'Ostensibly', definition: 'adverb — apparently or outwardly (but perhaps not really).', example: 'Ostensibly for health reasons, he quit.' },
  { term: 'Seemingly', definition: 'adverb — appearing to be the case.', example: 'Seemingly simple problems can be complex.' },
  { term: 'Paradoxically', definition: 'adverb — in a way that seems contradictory but may be true.', example: 'Paradoxically, more choice can lead to less happiness.' },
  { term: 'Ironically', definition: 'adverb — in a way opposite to what is expected.', example: "Ironically, the firefighter's house burned down." }
]

for (const item of items) {
  await prisma.word.upsert({
    where: { term: item.term },
    update: {
      definition: item.definition,
      example: item.example
    },
    create: {
      term: item.term,
      definition: item.definition,
      example: item.example,
      status: 'NEW'
    }
  })
}

const count = await prisma.word.count()
console.log(`Imported/updated ${items.length} words. Total in DB: ${count}`)

await prisma.$disconnect()
