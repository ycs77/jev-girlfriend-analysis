import dotenv from 'dotenv'
import { runExGirlfriendAnalysis } from '../core/ex-girlfriend.ts'
import { renderReport } from './output.ts'

dotenv.config({ quiet: true })

const [cliMessage, cliContext] = process.argv.slice(2)
if (cliMessage === undefined || cliMessage.trim() === '') {
  console.error('用法：./ex-girlfriend "前女友的訊息" "可選的前後文"')
  process.exit(1)
}

const report = await runExGirlfriendAnalysis(cliMessage, cliContext)
renderReport('前任翻譯器', report)
