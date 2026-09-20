import pc from 'picocolors'
import type { Report } from './types.ts'

const BAR_WIDTH = 20
const LABEL_WIDTH = 10
const CONTINUATION_PAD = '　　　　　'

function displayWidth(text: string): number {
  return [...text].reduce(
    (sum, char) => sum + (char.charCodeAt(0) > 0x2e80 ? 2 : 1),
    0,
  )
}

function label(text: string): string {
  const pad = Math.ceil(Math.max(0, LABEL_WIDTH - displayWidth(text)) / 2)
  return `${text}${'　'.repeat(pad)}`
}

export function moodSummary(index: number): string {
  if (index >= 75) return '可能明顯生氣或高度不舒服'
  if (index >= 50) return '可能不舒服、失望或關係緊繃'
  if (index >= 25) return '可能有點在意或有感觸'
  return '看起來平穩'
}

function moodColor(index: number): (text: string) => string {
  if (index >= 75) return (text) => pc.bold(pc.red(text))
  if (index >= 50) return pc.red
  if (index >= 25) return pc.yellow
  return pc.green
}

function moodBar(index: number): string {
  const filled = Math.round((index / 100) * BAR_WIDTH)
  const color = moodColor(index)
  return `${color('▓'.repeat(filled))}${'░'.repeat(BAR_WIDTH - filled)}`
}

export function renderReport(title: string, report: Report): void {
  const { message, context, mood, action, landmines } = report
  const diagnosis = 'diagnosis' in report ? report.diagnosis : undefined

  console.log()
  console.log(`${pc.bold(`── ${title} `)}${'─'.repeat(28)}`)
  console.log()
  console.log(`${label('訊息')}「${message}」`)
  console.log(`${label('脈絡')}${context}`)
  console.log()

  if (mood.kind === 'unreadable') {
    console.log(`${label('心情指數')}${pc.yellow('無法可靠判讀')}`)
  } else {
    const color = moodColor(mood.index)
    console.log(
      `${label('心情指數')}${moodBar(mood.index)}  ${color(`${mood.index}／100`)}`,
    )
    console.log(`${CONTINUATION_PAD}${moodSummary(mood.index)}`)
  }
  console.log()

  if (diagnosis !== undefined) {
    console.log(`${label('Jev 判讀')}${diagnosis}`)
    console.log()
  }

  console.log(`${label('建議行動')}${action.direction}`)
  if (action.phrasing !== undefined) {
    console.log(`${CONTINUATION_PAD}${pc.cyan(action.phrasing)}`)
  }
  console.log()

  if (landmines.length === 0) {
    console.log(`${label('地雷')}${pc.dim('無特定地雷')}`)
  } else {
    const items = landmines.map((item) => `${pc.red('✗')} ${item}`)
    console.log(`${label('地雷')}${items[0]}`)
    for (const item of items.slice(1)) {
      console.log(`${CONTINUATION_PAD}${item}`)
    }
  }
}
