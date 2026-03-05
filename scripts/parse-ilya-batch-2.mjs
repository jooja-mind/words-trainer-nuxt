import { readFileSync } from 'fs'

const raw = readFileSync('data/imports/teacher-2026-02-18-batch-2.txt','utf8').replace(/\r\n/g,' ').trim()
const tokens = raw.split(/\s+/)
const stop = new Set(['a','an','the','to','in','of','or','and','but','on','for','with','as','by','is','are','be','being','been','it','this','that','these','those','not','no','so','if','than','then','from','into','at','over','under','through','about','because','while','where','when','which','who','whom','whose','what','why','how'])
const isTerm = (t)=>/^[a-z][a-z-]*$/.test(t) && t.length>=3 && !stop.has(t)

let entries=[]
let i=0
while (i<tokens.length) {
  if (!isTerm(tokens[i])) { i++; continue }
  const term = tokens[i]
  let j=i+1
  // find next term
  while (j<tokens.length && !isTerm(tokens[j])) j++
  if (j<=i+1) { i++; continue }
  const def = tokens.slice(i+1, j).join(' ')
  if (def) entries.push({term, definition:def})
  i=j
}

console.log('tokens',tokens.length,'entries',entries.length)
console.log(entries.slice(0,5))
