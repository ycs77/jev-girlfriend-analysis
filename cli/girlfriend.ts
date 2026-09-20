import dotenv from 'dotenv'
import { runGirlfriendAnalysis } from '../core/girlfriend.ts'
import { renderReport } from './output.ts'

dotenv.config({ quiet: true })

const [cliMessage, cliContext] = process.argv.slice(2)
if (cliMessage === undefined || cliMessage.trim() === '') {
  console.error('用法：./girlfriend "女友的訊息" "可選的前後文"')
  process.exit(1)
}

const report = await runGirlfriendAnalysis(cliMessage, cliContext)
renderReport('女友翻譯器', report)
