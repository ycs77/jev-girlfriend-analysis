import { TypeSafeClient, choice, noul, score } from '@typesafe-ai/sdk'
import dotenv from 'dotenv'
import c from 'picocolors'

class Color {
  constructor(
    public color: string,
    public reset: string,
    public isColorLabel = false,
  ) {}

  text(text: string) {
    return `${this.color}${text}${this.reset}`
  }

  label(text: string) {
    return this.isColorLabel ? `${this.color}${text}${this.reset}` : text
  }
}

dotenv.config({ quiet: true })

const [message, context] = process.argv.slice(2)
if (message === undefined || message.trim() === '') {
  console.error('用法：./girlfriend "愛幹嘛幹嘛"')
  process.exit(1)
}

const client = new TypeSafeClient()
const response = await client.systemOne({
  state: {
    relationship: '交往三年的另一半',
    you_said: context || '我今天跟同事聚餐，會晚點回家喔',
    they_replied: message,
  },
  questions: {
    真正的意思: choice('What is the real feeling behind `they_replied`, given `relationship` and `you_said`?', {
      真的沒事: 'Genuinely fine, nothing hidden',
      有點失落: 'A bit disappointed or lonely, but not angry',
      在生氣: 'Angry or resentful, saying the opposite of what they mean',
      在試探你: 'Testing whether you will notice and care',
    }),
    火氣: score('How upset is the person who wrote `they_replied`', [
      '平靜',
      '有點悶',
      '明顯不高興',
      '快要爆炸',
    ]),
    該馬上關心: noul('You should reach out right now and show that you care about how they feel'),
  },
})

const feeling = response.answers.真正的意思
const upset = response.answers.火氣
const shouldReachOut = response.answers.該馬上關心

const [GREEN, RESET_GREEN] = ['\x1b[38;5;48m', '\x1b[39m']
const [ORANGE, RESET_ORANGE] = ['\x1b[38;5;214m', '\x1b[39m']
const [RED, RESET_RED] = ['\x1b[38;5;196m', '\x1b[39m']
const [GRAY, RESET_GRAY] = ['\x1b[38;5;248m', '\x1b[39m']
const [DIM_GRAY, RESET_DIM_GRAY] = ['\x1b[38;5;242m', '\x1b[39m']

function emotionColor(value: number, isUpset = false): Color {
  if (value < 0.4) return new Color(GRAY, RESET_GRAY)
  if (value < 0.7) return new Color(ORANGE, RESET_ORANGE, true)
  if (isUpset) return new Color(RED, RESET_RED, true)
  return new Color(GREEN, RESET_GREEN, true)
}

function upsetColor(value: number): Color {
  if (value < 1) return new Color(GREEN, RESET_GREEN)
  if (value < 2) return new Color(ORANGE, RESET_ORANGE, true)
  return new Color(RED, RESET_RED, true)
}

function renderStatusBar(color: Color, persentage: number) {
  const value = Math.round(persentage * 6)
  const perText = Math.round(persentage * 100).toString().padStart(3, ' ') + '%'
  let bar = ''
  for (let i = 0; i < 6; i++) {
    if (i < value) {
      bar += color.text('━')
    } else {
      bar += `${DIM_GRAY}─${RESET_DIM_GRAY}`
    }
  }
  bar += color.label(perText)
  return bar
}

function renderTree(items: string[]) {
  items.forEach((item, index) => {
    console.log(`  ${DIM_GRAY}${index === items.length - 1 ? '└' : '├'}─${RESET_DIM_GRAY} ${item}`)
  })
}

if (process.argv.includes('--debug')) {
  console.log('feeling', feeling)
  console.log('upset', upset)
  console.log('shouldReachOut', shouldReachOut)
}

console.log()
console.log(c.bold(c.blueBright(' 女友情緒分析')))
console.log()

console.log(` 🔍 真正的意思  ${GRAY}(信心值：${feeling.confidence * 100}%)${RESET_GRAY}`)
renderTree(
  Object.keys(feeling.probabilities)
    .map(label => {
      const value = feeling.probabilities[label as keyof typeof feeling.probabilities]
      return { label, value }
    })
    .sort((a, b) => b.value - a.value)
    .map(item => {
      const feelingColor = emotionColor(item.value, item.label === '在生氣')
      return `${renderStatusBar(feelingColor, item.value)} ${item.label}`
    })
)
console.log()

const upsetScore = Math.round(upset.score)
const isUpsetColor = upsetColor(upsetScore)
console.log(` 🔥 火氣  ${isUpsetColor.text(upset.score + ' / 3')}  ${GRAY}(信心值：${upset.confidence * 100}%)${RESET_GRAY}`)
renderTree(Object.keys(upset.legend).map(key => {
  const label = upset.legend[key as keyof typeof upset.legend]
  const value = upset.probabilities[key as keyof typeof upset.legend]
  const isCurrent = Number(key) === upsetScore
  const color: Color = isCurrent ? isUpsetColor : new Color(GRAY, RESET_GRAY)
  return `${color.label(key)} ${renderStatusBar(color, value)} ${label}`
}))
console.log()

const reachOutColor = emotionColor(shouldReachOut.noul, true)
console.log(' 🕒 該馬上關心')
renderTree([
  renderStatusBar(reachOutColor, shouldReachOut.noul),
])
console.log()
