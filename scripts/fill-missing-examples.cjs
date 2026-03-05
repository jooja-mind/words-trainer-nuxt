const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const examples = {
  aberration: "The sudden drop in sales was an aberration, not a long-term trend.",
  abstruse: "The professor's abstruse explanation left half the class confused.",
  accordingly: "The weather forecast warned of heavy rain, so we dressed accordingly.",
  acrimonious: "Their acrimonious debate ended with both sides refusing to compromise.",
  ambivalent: "She felt ambivalent about moving abroad, excited but also anxious.",
  appropriate: "Please wear appropriate clothing for the formal event.",
  aptitude: "He has a natural aptitude for solving complex puzzles.",
  arcane: "The old manuscript was full of arcane symbols nobody could decode.",
  backtrack: "After seeing the new evidence, the company had to backtrack on its claim.",
  begrudgingly: "He begrudgingly admitted that her plan worked better.",
  belligerent: "The customer became belligerent when we refused the refund.",
  blatantly: "He blatantly ignored the safety rules in front of everyone.",
  briefly: "Can we speak briefly before the meeting starts?",
  capricious: "The manager's capricious decisions made the team uneasy.",
  ceramic: "She bought a handmade ceramic bowl at the market.",
  certain: "I am certain we locked the door before leaving.",
  circumstances: "Under these circumstances, postponing the launch was the safest option.",
  clandestinely: "They met clandestinely to discuss the merger.",
  cohere: "Your arguments need to cohere if you want to convince the audience.",
  conditionally: "The feature was conditionally enabled only for beta users.",
  consequently: "He missed the deadline and consequently lost the contract.",
  contradictory: "Her two statements were clearly contradictory.",
  cumulative: "The cumulative effect of small improvements was impressive.",
  disconcerting: "The sudden silence in the hallway was disconcerting.",
  disproportionately: "The policy affected low-income families disproportionately.",
  ecosystem: "A healthy ecosystem depends on balance between many species.",
  effortlessly: "She switched between languages effortlessly during the interview.",
  egregiously: "The report was egregiously inaccurate and had to be rewritten.",
  exceedingly: "The route was exceedingly difficult after the storm.",
  exertion: "After hours of exertion, he finally reached the summit.",
  extent: "To what extent can automation replace manual work?",
  falter: "Even under pressure, she did not falter.",
  feasible: "Given our budget, this approach is not feasible.",
  immensely: "Your support helped me immensely during that period.",
  inevitably: "With no backup plan, failure became inevitably more likely.",
  ironically: "Ironically, the app crashed during a reliability demo.",
  meticulously: "She meticulously documented every step of the experiment.",
  ostensibly: "He resigned ostensibly for health reasons.",
  painstakingly: "The archive was painstakingly restored page by page.",
  paradoxically: "Paradoxically, fewer meetings made the team more aligned.",
  peroxide: "The nurse cleaned the wound with peroxide.",
  proactively: "We contacted users proactively before the maintenance window.",
  profoundly: "The book profoundly changed how I think about leadership.",
  purportedly: "The document was purportedly signed by the director.",
  remarkably: "The engine remained remarkably quiet at high speed.",
  resilient: "Our infrastructure is resilient enough to handle sudden traffic spikes.",
  revered: "She is revered in the field for her groundbreaking research.",
  saline: "The doctor used a saline solution to rinse the wound.",
  seemingly: "The issue was seemingly minor but caused major delays.",
  strikingly: "The two paintings are strikingly similar in style.",
  surreptitiously: "He surreptitiously recorded the conversation on his phone.",
  swam: "She swam across the lake before sunrise.",
  threats: "The system blocked multiple security threats overnight.",
  traction: "The new feature is finally gaining traction with users.",
  transformation: "Digital transformation requires both tools and mindset changes.",
  trial: "We ran a two-week trial before buying the software.",
  unabashedly: "She unabashedly celebrated every small victory.",
  uncertain: "I am uncertain whether the package will arrive today.",
  undoubtedly: "This is undoubtedly the best result we have seen so far.",
  unequivocally: "The witness unequivocally denied any involvement.",
  unsettled: "The sudden announcement left the team unsettled.",
  utterly: "By midnight, he was utterly exhausted.",
  vastly: "The new process is vastly more efficient than the old one.",
  viable: "We need a viable plan before presenting to investors."
}

async function main() {
  let updated = 0
  for (const [term, example] of Object.entries(examples)) {
    const res = await prisma.word.updateMany({
      where: {
        term,
        OR: [{ example: null }, { example: '' }],
      },
      data: { example },
    })
    updated += res.count
  }

  const stillMissing = await prisma.word.count({
    where: { OR: [{ example: null }, { example: '' }] },
  })

  console.log(JSON.stringify({ updated, stillMissing }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
